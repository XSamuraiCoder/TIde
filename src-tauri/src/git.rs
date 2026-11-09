// Source control for the open project folder. Runs the git command line, so it uses the user's own
// git configuration, credentials and hooks. Each command does one thing the Source Control view needs.
use serde::Serialize;
use std::io::ErrorKind;
use std::process::Command;

#[derive(Serialize)]
pub struct GitResult {
    pub ok: bool,
    pub output: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitFile {
    pub path: String,
    /// Staged state, as in `git status --porcelain`: M, A, D, R, C, U, ? or a space.
    pub index: String,
    /// Working tree state, same letters.
    pub worktree: String,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct GitStatus {
    pub repo: bool,
    pub branch: String,
    pub upstream: bool,
    pub ahead: u32,
    pub behind: u32,
    pub files: Vec<GitFile>,
}

fn git(dir: &str, args: &[&str]) -> Result<GitResult, String> {
    let mut command = Command::new("git");
    command.current_dir(dir).args(args);
    // Never wait on a password prompt in a terminal nobody can see.
    command.env("GIT_TERMINAL_PROMPT", "0");
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x0800_0000;
        command.creation_flags(CREATE_NO_WINDOW);
    }
    let out = command.output().map_err(|e| match e.kind() {
        ErrorKind::NotFound => "git was not found. Install Git and add it to PATH.".to_string(),
        _ => e.to_string(),
    })?;
    let mut output = String::from_utf8_lossy(&out.stdout).into_owned();
    output.push_str(&String::from_utf8_lossy(&out.stderr));
    Ok(GitResult { ok: out.status.success(), output })
}

/// Parses `git status --porcelain=v1 --branch -z`.
fn parse_status(raw: &str) -> GitStatus {
    let mut status = GitStatus { repo: true, branch: String::new(), upstream: false, ahead: 0, behind: 0, files: Vec::new() };
    let mut parts = raw.split('\0').filter(|p| !p.is_empty());
    while let Some(part) = parts.next() {
        if let Some(head) = part.strip_prefix("## ") {
            // "main...origin/main [ahead 1, behind 2]", "No commits yet on main", or "HEAD (no branch)"
            let (names, counts) = head.split_once(" [").unwrap_or((head, ""));
            let names = names.strip_prefix("No commits yet on ").unwrap_or(names);
            let (branch, upstream) = names.split_once("...").map_or((names, false), |(b, _)| (b, true));
            status.branch = branch.to_string();
            status.upstream = upstream;
            for count in counts.trim_end_matches(']').split(", ") {
                if let Some(n) = count.strip_prefix("ahead ") { status.ahead = n.parse().unwrap_or(0); }
                if let Some(n) = count.strip_prefix("behind ") { status.behind = n.parse().unwrap_or(0); }
            }
            continue;
        }
        if part.len() < 4 { continue; }
        let (index, worktree) = (&part[0..1], &part[1..2]);
        // A rename or copy is followed by the old path, which the view doesn't need.
        if index == "R" || index == "C" { parts.next(); }
        status.files.push(GitFile { path: part[3..].to_string(), index: index.to_string(), worktree: worktree.to_string() });
    }
    status
}

#[tauri::command(async)]
pub fn git_status(dir: String) -> Result<GitStatus, String> {
    let result = git(&dir, &["status", "--porcelain=v1", "--branch", "-z", "--untracked-files=all"])?;
    if !result.ok {
        if result.output.contains("not a git repository") {
            return Ok(GitStatus { repo: false, branch: String::new(), upstream: false, ahead: 0, behind: 0, files: Vec::new() });
        }
        return Err(result.output.trim().to_string());
    }
    Ok(parse_status(&result.output))
}

#[tauri::command(async)]
pub fn git_stage(dir: String, paths: Vec<String>) -> Result<GitResult, String> {
    let mut args = vec!["add", "-A", "--"];
    args.extend(paths.iter().map(String::as_str));
    git(&dir, &args)
}

#[tauri::command(async)]
pub fn git_unstage(dir: String, paths: Vec<String>) -> Result<GitResult, String> {
    let mut args = vec!["restore", "--staged", "--"];
    args.extend(paths.iter().map(String::as_str));
    let result = git(&dir, &args)?;
    if result.ok { return Ok(result); }
    // Before the first commit there is no HEAD to restore from, so take the files out of the index instead.
    let mut args = vec!["rm", "--cached", "-r", "-q", "--"];
    args.extend(paths.iter().map(String::as_str));
    git(&dir, &args)
}

#[tauri::command(async)]
pub fn git_commit(dir: String, message: String) -> Result<GitResult, String> {
    git(&dir, &["commit", "-m", &message])
}

#[tauri::command(async)]
pub fn git_push(dir: String) -> Result<GitResult, String> {
    git(&dir, &["push"])
}

#[tauri::command(async)]
pub fn git_pull(dir: String) -> Result<GitResult, String> {
    git(&dir, &["pull", "--ff-only"])
}

#[tauri::command(async)]
pub fn git_init(dir: String) -> Result<GitResult, String> {
    git(&dir, &["init"])
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_branch_counts_and_files() {
        let s = parse_status("## main...origin/main [ahead 2, behind 1]\0M  src/a.c\0 M b.h\0?? new.txt\0R  new.s\0old.s\0");
        assert_eq!((s.branch.as_str(), s.upstream, s.ahead, s.behind), ("main", true, 2, 1));
        let files: Vec<_> = s.files.iter().map(|f| format!("{}{}{}", f.index, f.worktree, f.path)).collect();
        assert_eq!(files, ["M src/a.c", " Mb.h", "??new.txt", "R new.s"]);
    }

    #[test]
    fn parses_a_repo_with_no_commits() {
        let s = parse_status("## No commits yet on main\0A  x\0");
        assert_eq!((s.branch.as_str(), s.upstream), ("main", false));
        assert_eq!(s.files.len(), 1);
    }

    #[test]
    fn stages_commits_and_reports_status() {
        let dir = std::env::temp_dir().join(format!("tide-git-{}", std::process::id()));
        std::fs::create_dir_all(&dir).unwrap();
        let d = dir.to_string_lossy().into_owned();
        assert!(git_init(d.clone()).unwrap().ok);
        git(&d, &["config", "user.email", "test@example.com"]).unwrap();
        git(&d, &["config", "user.name", "Test"]).unwrap();
        std::fs::write(dir.join("a.txt"), "hi").unwrap();
        assert_eq!(git_status(d.clone()).unwrap().files[0].index, "?");
        assert!(git_stage(d.clone(), vec!["a.txt".into()]).unwrap().ok);
        assert_eq!(git_status(d.clone()).unwrap().files[0].index, "A");
        assert!(git_unstage(d.clone(), vec!["a.txt".into()]).unwrap().ok); // no HEAD yet
        assert!(git_stage(d.clone(), vec!["a.txt".into()]).unwrap().ok);
        assert!(git_commit(d.clone(), "first".into()).unwrap().ok);
        assert!(git_status(d.clone()).unwrap().files.is_empty());
        std::fs::remove_dir_all(&dir).unwrap();
    }
}
