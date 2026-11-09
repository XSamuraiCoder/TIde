// Documentation for the TI-BASIC commands that aren't in the main command table (commands.ts):
// everything else the tokenizer accepts, so every catalog entry has a description.
// Keys are the names as the catalog lists them (the token sheet's ASCII spelling, e.g. "R>Pr(" for R▶Pr().

export type TiCategory =
  | "Control" | "Screen and input" | "Drawing" | "Color" | "Math" | "Probability" | "Lists and matrices"
  | "Strings" | "Statistics" | "Statistical tests" | "Graph settings" | "Modes" | "Clock" | "Finance" | "Memory and programs";

export interface TiDoc { category: TiCategory; usage: string; doc: string }

/** Catalog order of the categories. */
export const TI_CATEGORIES: TiCategory[] = [
  "Control", "Screen and input", "Drawing", "Color", "Math", "Probability", "Lists and matrices", "Strings",
  "Statistics", "Statistical tests", "Graph settings", "Modes", "Clock", "Finance", "Memory and programs",
];

const d = (category: TiCategory) => (usage: string, doc: string): TiDoc => ({ category, usage, doc });
const ctl = d("Control"), io = d("Screen and input"), draw = d("Drawing"), color = d("Color"), math = d("Math");
const prob = d("Probability"), list = d("Lists and matrices"), str = d("Strings"), stat = d("Statistics");
const test = d("Statistical tests"), graph = d("Graph settings"), mode = d("Modes"), clock = d("Clock");
const fin = d("Finance"), mem = d("Memory and programs");

export const TI_DOCS: Record<string, TiDoc> = {
  // Control
  "IS>(": ctl("IS>(variable,value)", "Adds 1 to the variable, then skips the next line if the result is greater than the value."),
  "DS<(": ctl("DS<(variable,value)", "Subtracts 1 from the variable, then skips the next line if the result is less than the value."),
  "Wait": ctl("Wait seconds", "Pauses for the given number of seconds (decimals allowed). CE only, OS 5.5 and later."),
  "prgm": ctl("prgmNAME", "Runs another program, then continues here when it returns."),

  // Screen and input
  "Ans": io("Ans", "The result of the last expression evaluated. Faster than a variable and needs no storing."),
  "Get(": io("Get(variable)", "Reads a variable from a connected CBL or CBR data logger."),
  "Send(": io("Send(variable)", "Sends a variable to a connected CBL or CBR data logger."),
  "GetCalc(": io("GetCalc(variable[,port])", "Copies a variable from a calculator connected by cable."),
  "DispTable": io("DispTable", "Shows the table screen."),
  "ClrTable": io("ClrTable", "Clears the table screen."),

  // Drawing
  "Pt-Off(": draw("Pt-Off(x,y[,mark])", "Erases a point in graph coordinates. Mark: 1 dot, 2 box, 3 cross."),
  "Pt-Change(": draw("Pt-Change(x,y)", "Toggles a point in graph coordinates."),
  "Pxl-Change(": draw("Pxl-Change(row,column)", "Toggles a pixel."),
  "pxl-Test(": draw("pxl-Test(row,column)", "1 if the pixel is on, 0 if it is off."),
  "Horizontal": draw("Horizontal y", "Draws a horizontal line across the graph at y."),
  "Vertical": draw("Vertical x", "Draws a vertical line across the graph at x."),
  "Tangent(": draw("Tangent(expression,x)", "Draws the tangent line to an expression at x."),
  "DrawF": draw("DrawF expression", "Draws a function of X on the graph without storing it in Y=."),
  "DrawInv": draw("DrawInv expression", "Draws the inverse of a function of X."),
  "Shade(": draw("Shade(lower,upper[,xleft,xright,pattern,resolution])", "Shades the area between two functions of X."),
  "StorePic": draw("StorePic n", "Saves the graph screen to picture n (0–9)."),
  "RecallPic": draw("RecallPic n", "Draws picture n over the graph screen."),
  "StoreGDB": draw("StoreGDB n", "Saves the graph settings and functions to graph database n (0–9)."),
  "RecallGDB": draw("RecallGDB n", "Restores graph database n."),

  // Color (CE)
  "TextColor(": color("TextColor(color)", "Sets the color of Text( on the graph screen. Colors are 10–24 or names like BLUE. CE only."),
  "GraphColor(": color("GraphColor(function#,color)", "Sets the color of a Y= function. CE only."),
  "BackgroundOn": color("BackgroundOn color", "Fills the graph background with a color or an image (Image1–Image0). CE only."),
  "BorderColor": color("BorderColor n", "Sets the color of the border around the graph (1–4). CE only."),
  "GridLine": color("GridLine", "Draws the graph grid as lines. CE only."),
  "GridDot": color("GridDot", "Draws the graph grid as dots. CE only."),

  // Math
  "sin(": math("sin(angle)", "Sine of an angle, in the current angle mode."),
  "cos(": math("cos(angle)", "Cosine of an angle, in the current angle mode."),
  "tan(": math("tan(angle)", "Tangent of an angle, in the current angle mode."),
  "asin(": math("sin⁻¹(value)", "Inverse sine (arcsine)."),
  "acos(": math("cos⁻¹(value)", "Inverse cosine (arccosine)."),
  "atan(": math("tan⁻¹(value)", "Inverse tangent (arctangent)."),
  "sinh(": math("sinh(value)", "Hyperbolic sine."),
  "cosh(": math("cosh(value)", "Hyperbolic cosine."),
  "tanh(": math("tanh(value)", "Hyperbolic tangent."),
  "asinh(": math("sinh⁻¹(value)", "Inverse hyperbolic sine."),
  "acosh(": math("cosh⁻¹(value)", "Inverse hyperbolic cosine."),
  "atanh(": math("tanh⁻¹(value)", "Inverse hyperbolic tangent."),
  "sqrt(": math("√(value)", "Square root."),
  "cuberoot(": math("³√(value)", "Cube root."),
  "ln(": math("ln(value)", "Natural logarithm (base e)."),
  "log(": math("log(value)", "Logarithm base 10."),
  "logBASE(": math("logBASE(value,base)", "Logarithm in any base."),
  "gcd(": math("gcd(a,b)", "Greatest common divisor of two whole numbers."),
  "lcm(": math("lcm(a,b)", "Least common multiple of two whole numbers."),
  "remainder(": math("remainder(dividend,divisor)", "Remainder of a division. Works on lists too."),
  "not(": math("not(value)", "1 if the value is 0, otherwise 0."),
  "real(": math("real(value)", "Real part of a complex number."),
  "imag(": math("imag(value)", "Imaginary part of a complex number."),
  "conj(": math("conj(value)", "Complex conjugate."),
  "angle(": math("angle(value)", "Polar angle of a complex number."),
  "nDeriv(": math("nDeriv(expression,variable,value[,h])", "Numeric derivative of an expression at a value."),
  "fnInt(": math("fnInt(expression,variable,lower,upper)", "Numeric integral of an expression between two limits."),
  "fMin(": math("fMin(expression,variable,lower,upper)", "The value of the variable where the expression is smallest in the range."),
  "fMax(": math("fMax(expression,variable,lower,upper)", "The value of the variable where the expression is largest in the range."),
  "solve(": math("solve(expression,variable,guess[,{lower,upper}])", "Finds where the expression equals 0, starting from a guess."),
  "Sigma(": math("Σ(expression,variable,start,end)", "Adds the expression for each whole value of the variable from start to end."),
  "piecewise(": math("piecewise(value1,condition1[,value2,condition2…])", "The value of the first true condition. CE only, OS 5.3 and later."),
  "P>Rx(": math("P▶Rx(r,θ)", "X coordinate of a polar point."),
  "P>Ry(": math("P▶Ry(r,θ)", "Y coordinate of a polar point."),
  "R>Pr(": math("R▶Pr(x,y)", "Distance r of a rectangular point from the origin."),
  "R>Ptheta(": math("R▶Pθ(x,y)", "Angle θ of a rectangular point."),

  // Probability
  "rand": prob("rand[(count)]", "A random number between 0 and 1, or a list of them. Store a number to rand to seed it."),
  "randBin(": prob("randBin(trials,p[,count])", "A random number of successes from a binomial distribution."),
  "randNorm(": prob("randNorm(mean,σ[,count])", "A random number from a normal distribution."),
  "randIntNoRep(": prob("randIntNoRep(lower,upper[,count])", "The whole numbers from lower to upper in random order, with no repeats."),
  "randM(": prob("randM(rows,columns)", "A matrix of random whole numbers from −9 to 9."),
  "normalpdf(": prob("normalpdf(x[,mean,σ])", "Normal probability density at x."),
  "normalcdf(": prob("normalcdf(lower,upper[,mean,σ])", "Normal probability between two bounds."),
  "invNorm(": prob("invNorm(area[,mean,σ])", "The value with the given area to its left under a normal curve."),
  "invT(": prob("invT(area,df)", "The value with the given area to its left under a t curve."),
  "tpdf(": prob("tpdf(x,df)", "Student t probability density at x."),
  "tcdf(": prob("tcdf(lower,upper,df)", "Student t probability between two bounds."),
  "Fpdf(": prob("Fpdf(x,numerator df,denominator df)", "F distribution probability density at x."),
  "Fcdf(": prob("Fcdf(lower,upper,numerator df,denominator df)", "F distribution probability between two bounds."),
  "binompdf(": prob("binompdf(trials,p[,x])", "Probability of exactly x successes in a binomial distribution."),
  "binomcdf(": prob("binomcdf(trials,p[,x])", "Probability of x or fewer successes in a binomial distribution."),
  "invBinom(": prob("invBinom(area,trials,p)", "Smallest number of successes with at least the given cumulative probability."),
  "poissonpdf(": prob("poissonpdf(μ,x)", "Probability of exactly x events in a Poisson distribution."),
  "poissoncdf(": prob("poissoncdf(μ,x)", "Probability of x or fewer events in a Poisson distribution."),
  "geometpdf(": prob("geometpdf(p,x)", "Probability that the first success is on trial x."),
  "geometcdf(": prob("geometcdf(p,x)", "Probability that the first success is on or before trial x."),
  "ShadeNorm(": prob("ShadeNorm(lower,upper[,mean,σ])", "Draws a normal curve and shades the area between two bounds."),
  "Shade_t(": prob("Shade_t(lower,upper,df)", "Draws a t curve and shades the area between two bounds."),
  "ShadeF(": prob("ShadeF(lower,upper,numerator df,denominator df)", "Draws an F curve and shades the area between two bounds."),

  // Lists and matrices
  "seq(": list("seq(expression,variable,start,end[,step])", "A list of the expression's values as the variable counts from start to end."),
  "cumSum(": list("cumSum(list)", "Running totals of a list or of a matrix's columns."),
  "DeltaList(": list("ΔList(list)", "Differences between consecutive items of a list."),
  "prod(": list("prod(list[,start,end])", "Multiplies the items of a list together."),
  "median(": list("median(list[,frequencies])", "Middle value of a list."),
  "stdDev(": list("stdDev(list[,frequencies])", "Sample standard deviation of a list."),
  "variance(": list("variance(list[,frequencies])", "Sample variance of a list."),
  "SortA(": list("SortA(list[,list…])", "Sorts a list in ascending order. Further lists are reordered to match."),
  "SortD(": list("SortD(list[,list…])", "Sorts a list in descending order. Further lists are reordered to match."),
  "ClrList": list("ClrList list[,list…]", "Empties lists, setting their size to 0."),
  "ClrAllLists": list("ClrAllLists", "Empties every list in memory."),
  "SetUpEditor": list("SetUpEditor [list,…]", "Sets which lists the list editor shows. With no lists, restores L1–L6."),
  "Select(": list("Select(xlist,ylist)", "Lets the user pick points on a scatter plot and keeps only those in the two lists."),
  "List>matr(": list("List▶matr(list,…,matrix)", "Builds a matrix whose columns are the lists."),
  "Matr>list(": list("Matr▶list(matrix,list,…)", "Copies the columns of a matrix into lists."),
  "det(": list("det(matrix)", "Determinant of a square matrix."),
  "identity(": list("identity(size)", "An identity matrix of the given size."),
  "ref(": list("ref(matrix)", "Row-echelon form of a matrix."),
  "rref(": list("rref(matrix)", "Reduced row-echelon form of a matrix."),
  "rowSwap(": list("rowSwap(matrix,rowA,rowB)", "A copy of the matrix with two rows swapped."),
  "row+(": list("row+(matrix,rowA,rowB)", "A copy of the matrix with row A added to row B."),

  // Strings
  "toString(": str("toString(value[,format])", "Turns a number or expression into a string. CE only, OS 5.2 and later."),
  "eval(": str("eval(expression)", "Evaluates an expression, giving its value. Use with toString( to convert numbers. CE only."),
  "Equ>String(": str("Equ▶String(Y-var,Str-var)", "Copies an equation (such as Y1) into a string."),
  "String>Equ(": str("String▶Equ(string,Y-var)", "Stores a string as an equation (such as Y1)."),

  // Statistics
  "1-Var Stats": stat("1-Var Stats [list,frequencies]", "Mean, standard deviation, quartiles and more for one list. Results go to the statistics variables."),
  "2-Var Stats": stat("2-Var Stats [xlist,ylist,frequencies]", "Statistics for paired lists, including sums and correlation."),
  "Med-Med": stat("Med-Med [xlist,ylist,frequencies,regEQ]", "Median-median line fit."),
  "LinReg(ax+b)": stat("LinReg(ax+b) [xlist,ylist,frequencies,regEQ]", "Linear regression in the form y=ax+b."),
  "LinReg(a+bx)": stat("LinReg(a+bx) [xlist,ylist,frequencies,regEQ]", "Linear regression in the form y=a+bx."),
  "QuadReg": stat("QuadReg [xlist,ylist,frequencies,regEQ]", "Quadratic regression (y=ax²+bx+c)."),
  "CubicReg": stat("CubicReg [xlist,ylist,frequencies,regEQ]", "Cubic regression."),
  "QuartReg": stat("QuartReg [xlist,ylist,frequencies,regEQ]", "Quartic regression."),
  "LnReg": stat("LnReg [xlist,ylist,frequencies,regEQ]", "Logarithmic regression (y=a+b·ln x)."),
  "ExpReg": stat("ExpReg [xlist,ylist,frequencies,regEQ]", "Exponential regression (y=a·bˣ)."),
  "PwrReg": stat("PwrReg [xlist,ylist,frequencies,regEQ]", "Power regression (y=a·xᵇ)."),
  "Logistic": stat("Logistic [xlist,ylist,frequencies,regEQ]", "Logistic regression."),
  "SinReg": stat("SinReg [iterations,xlist,ylist,period,regEQ]", "Sinusoidal regression."),
  "Manual-Fit": stat("Manual-Fit [Y-var]", "Lets the user fit a line to a scatter plot by hand."),
  "Plot1(": stat("Plot1(type,xlist,ylist[,mark,color])", "Sets up stat plot 1 and turns it on."),
  "Plot2(": stat("Plot2(type,xlist,ylist[,mark,color])", "Sets up stat plot 2 and turns it on."),
  "Plot3(": stat("Plot3(type,xlist,ylist[,mark,color])", "Sets up stat plot 3 and turns it on."),
  "PlotsOn": stat("PlotsOn [1,2,3]", "Turns stat plots on: all of them, or the numbers given."),
  "PlotsOff": stat("PlotsOff [1,2,3]", "Turns stat plots off: all of them, or the numbers given."),

  // Statistical tests
  "Z-Test(": test("Z-Test(μ0,σ,list[,frequencies,alternative,draw])", "Hypothesis test for a mean with a known σ."),
  "T-Test": test("T-Test μ0,list[,frequencies,alternative,draw]", "Hypothesis test for a mean with an unknown σ."),
  "2-SampZTest(": test("2-SampZTest(σ1,σ2,list1,list2[,…])", "Compares two means with known σ."),
  "2-SampTTest": test("2-SampTTest list1,list2[,…]", "Compares two means with unknown σ."),
  "1-PropZTest(": test("1-PropZTest(p0,successes,n[,alternative,draw])", "Hypothesis test for one proportion."),
  "2-PropZTest(": test("2-PropZTest(x1,n1,x2,n2[,alternative,draw])", "Compares two proportions."),
  "ZInterval": test("ZInterval σ,list[,frequencies,level]", "Confidence interval for a mean with a known σ."),
  "TInterval": test("TInterval list[,frequencies,level]", "Confidence interval for a mean with an unknown σ."),
  "2-SampZInt(": test("2-SampZInt(σ1,σ2,list1,list2[,…])", "Confidence interval for the difference of two means, known σ."),
  "2-SampTInt": test("2-SampTInt list1,list2[,…]", "Confidence interval for the difference of two means, unknown σ."),
  "1-PropZInt(": test("1-PropZInt(successes,n[,level])", "Confidence interval for one proportion."),
  "2-PropZInt(": test("2-PropZInt(x1,n1,x2,n2[,level])", "Confidence interval for the difference of two proportions."),
  "2-SampFTest": test("2-SampFTest list1,list2[,…]", "Compares the variances of two samples."),
  "LinRegTTest": test("LinRegTTest [xlist,ylist,frequencies,alternative,regEQ]", "Tests the slope of a linear regression."),
  "LinRegTInt": test("LinRegTInt [xlist,ylist,frequencies,level,regEQ]", "Confidence interval for the slope of a linear regression. CE and 84 Plus OS 2.30+."),
  "ANOVA(": test("ANOVA(list1,list2[,…])", "One-way analysis of variance across several lists."),

  // Graph settings
  "FnOn": graph("FnOn [function#,…]", "Turns Y= functions on: all of them, or the numbers given."),
  "FnOff": graph("FnOff [function#,…]", "Turns Y= functions off: all of them, or the numbers given."),
  "GraphStyle(": graph("GraphStyle(function#,style)", "Sets how a Y= function is drawn (1 line, 2 thick, 3 shade above, 4 below, 5 path, 6 animate, 7 dotted)."),
  "AxesOn": graph("AxesOn [color]", "Shows the graph axes."),
  "AxesOff": graph("AxesOff", "Hides the graph axes."),
  "GridOff": graph("GridOff", "Hides the graph grid."),
  "LabelOn": graph("LabelOn", "Shows axis labels."),
  "LabelOff": graph("LabelOff", "Hides axis labels."),
  "ExprOn": graph("ExprOn", "Shows the function when tracing."),
  "ExprOff": graph("ExprOff", "Hides the function when tracing."),
  "ZStandard": graph("ZStandard", "Resets the window to −10…10 on both axes."),
  "ZSquare": graph("ZSquare", "Adjusts the window so pixels are square and circles look round."),
  "ZDecimal": graph("ZDecimal", "Sets the window so each pixel is 0.1 wide."),
  "ZTrig": graph("ZTrig", "Sets a window suited to trigonometric functions."),
  "ZoomFit": graph("ZoomFit", "Adjusts Ymin and Ymax to fit the functions being graphed."),

  // Modes
  "Normal": mode("Normal", "Shows numbers in normal notation."),
  "Sci": mode("Sci", "Shows numbers in scientific notation."),
  "Eng": mode("Eng", "Shows numbers in engineering notation."),
  "Float": mode("Float", "Shows as many decimal places as needed."),
  "Fix": mode("Fix digits", "Shows a fixed number of decimal places (0–9)."),
  "Radian": mode("Radian", "Uses radians for angles."),
  "Degree": mode("Degree", "Uses degrees for angles."),
  "Func": mode("Func", "Graphs functions of X (Y=)."),
  "Param": mode("Param", "Graphs parametric equations."),
  "Polar": mode("Polar", "Graphs polar equations."),
  "Seq": mode("Seq", "Graphs sequences."),
  "Full": mode("Full", "Uses the full screen (no split)."),

  // Clock
  "startTmr": clock("startTmr", "The current clock time in seconds, to use with checkTmr(."),
  "checkTmr(": clock("checkTmr(start)", "Seconds passed since a startTmr value."),
  "getTime": clock("getTime", "The time as a list {hour,minute,second}."),
  "getDate": clock("getDate", "The date as a list {year,month,day}."),
  "getTmStr(": clock("getTmStr(format)", "The time as a string: 12 or 24 hour."),
  "getDtStr(": clock("getDtStr(format)", "The date as a string: 1 M/D/Y, 2 D/M/Y, 3 Y/M/D."),
  "setTime(": clock("setTime(hour,minute,second)", "Sets the clock time (24-hour)."),
  "setDate(": clock("setDate(year,month,day)", "Sets the clock date."),
  "setTmFmt(": clock("setTmFmt(format)", "Sets how the time is shown: 12 or 24."),
  "setDtFmt(": clock("setDtFmt(format)", "Sets how the date is shown: 1 M/D/Y, 2 D/M/Y, 3 Y/M/D."),
  "timeCnv(": clock("timeCnv(seconds)", "Splits a number of seconds into {days,hours,minutes,seconds}."),
  "dayOfWk(": clock("dayOfWk(year,month,day)", "Day of the week, from 1 (Sunday) to 7 (Saturday)."),

  // Finance
  "npv(": fin("npv(rate,CF0,CFList[,CFFreq])", "Net present value of a series of cash flows."),
  "irr(": fin("irr(CF0,CFList[,CFFreq])", "Internal rate of return of a series of cash flows."),
  "bal(": fin("bal(npmt[,roundValue])", "Loan balance after a number of payments, using the TVM variables."),
  "SigmaPrn(": fin("ΣPrn(pmt1,pmt2[,roundValue])", "Principal paid between two payments, using the TVM variables."),
  "SigmaInt(": fin("ΣInt(pmt1,pmt2[,roundValue])", "Interest paid between two payments, using the TVM variables."),
  "dbd(": fin("dbd(date1,date2)", "Days between two dates written as MM.DDYY or DDMM.YY."),

  // Memory and programs
  "Archive": mem("Archive variable", "Moves a variable to archive (flash) memory, where it survives RAM resets."),
  "UnArchive": mem("UnArchive variable", "Moves a variable back to RAM so it can be used."),
  "Asm(": mem("Asm(prgmNAME)", "Runs an assembly program. Not needed on the CE, where assembly programs run directly."),
  "AsmComp(": mem("AsmComp(prgmSOURCE,prgmTARGET)", "Compiles a hex assembly program to binary. TI-84 Plus only."),
  "OpenLib(": mem("OpenLib(library)", "Opens a Flash application library for ExecLib."),
  "ExecLib": mem("ExecLib", "Runs a routine from the library opened with OpenLib(."),
};

/** Documentation for a name as the editor sees it (sin), with or without its opening parenthesis. */
export const tiDoc = (word: string) => TI_DOCS[word + "("] ?? TI_DOCS[word];
