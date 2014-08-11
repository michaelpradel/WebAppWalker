(function() {

    var fileSuffix = "_eventLoopsInstrumented_";
    var markerPrefix = "#WAW_NAME_";
    var markerSuffix = "_WAW_NAME#";
    var globalCostVarName = "$WAW_cost";
    var usedNamesFile = process.cwd() + "/instrumentFF_tmp/usedFctNames.json";

    var fs = require('fs');
    var esprima = require('esprima');
    var escodegen = require('escodegen');
    var traverse = require("ast-traverse");

    var traceEntriesToIgnore = [
        "http127.0.0.18181teststizentodolistjsiscroll-lite.js:156:69",
        "http127.0.0.18181teststizentodolistjsiscroll-lite.js:190:20"
    ];

    function instrumentFunctions(code) {
        try {
            var ast = esprima.parse(code, {loc:true, range:true});
        } catch (e) {
            console.log("\nError during parsing of " + fileName + " in eventloops instrumenter. Will ignore this file.\n" + e);
            return code;
        }
        traverse(ast, {pre:function() {
            }, post:post});
        instrumentProgram(ast);
        var transformedCode = escodegen.generate(ast);
        return transformedCode;
    }

    function post(node, parent, prop, index) {
        if (node.type === "FunctionDeclaration" ||
              node.type === "FunctionExpression") {
            instrumentFunction(node, parent, prop, index);
        } else if (node.type === "IfStatement") {
            instrumentIfStatement(node, parent, prop, index);
        } else if (node.type === "WhileStatement" ||
              node.type === "ForStatement" ||
              node.type === "ForInStatement" ||
              node.type === "DoWhileStatement") {
            instrumentLoopStatement(node, parent, prop, index);
        }
    }

    function instrumentProgram(ast) {
        if (!ast || ast.type !== "Program")
            return;
        var programId = markerPrefix + uniqueWithPrefix("<top-level>") + markerSuffix;
        var exprStmt = getFreshStringLiteralExpr(programId);
        ast.body.splice(0, 0, exprStmt);
    }

    function loadUsedNames() {
        try {
            var json = fs.readFileSync(usedNamesFile, "utf8");
            usedNames = JSON.parse(json);
            console.log("Have loaded " + Object.keys(usedNames).length + " used function names");
        } catch (e) { /* ignore: no used names file */
        }
    }

    function storeUsedNames() {
        var data = JSON.stringify(usedNames);
        fs.writeFileSync(usedNamesFile, data);
    }

    var usedNames = {};

    function uniqueWithPrefix(p) {
        var cand = p;
        var ctr = 0;
        while (true) {
            if (usedNames[cand] === undefined) {
                usedNames[cand] = true;
                return cand;
            }
            cand = p + (ctr++);
        }
    }

    function findFunctionName(node, parent, prop, index) {
        if (node.type === "FunctionDeclaration") {
            return node.id.name;
        } else if (node.type === "FunctionExpression") {
            if (parent.type === "VariableDeclarator") {
                return parent.id.name;
            } else if (parent.type === "AssignmentExpression" &&
                  parent.left.type === "Identifier") {
                return parent.left.name;
            } else if (parent.type === "AssignmentExpression" &&
                  parent.left.type === "MemberExpression" &&
                  parent.left.property && parent.left.property.type === "Identifier") {
                return parent.left.property.name;
            } else if (parent.type === "Property" && parent.key.type === "Identifier") {
                return parent.key.name;
            }
        }
        return uniqueWithPrefix(shortFileName + "<anon>");
    }

    function instrumentFunction(node, parent, prop, index) {
        if (isIgnoredNode(node))
            return;

        var fctName = findFunctionName(node, parent, prop, index);
        var uniqueFctName = uniqueWithPrefix(fctName);
        var fctId = markerPrefix + uniqueFctName + markerSuffix;
        var fctIdExprStmt = getFreshStringLiteralExpr(fctId);
        var costCtrStmt = getFreshCostCtrStmt();
        node.body.body.splice(0, 0, fctIdExprStmt);
        node.body.body.splice(0, 0, costCtrStmt);
    }

    function instrumentLoopStatement(node, parent, prop, index) {
        if (isIgnoredNode(node))
            return;

        // turn non-block into block
        if (node.body.type === "ExpressionStatement") {
            node.body = wrapAsBlock(node.body);
        }

        // instrument on block-level
        if (node.body.type === "BlockStatement") {
            var costCtrStmt = getFreshCostCtrStmt();
            node.body.body.splice(0, 0, costCtrStmt);
        }
    }

    function instrumentIfStatement(node) {
        if (isIgnoredNode(node))
            return;

        // turn non-blocks into blocks
        if (node.consequent.type === "ExpressionStatement") {
            node.consequent = wrapAsBlock(node.consequent);
        }
        if (node.alternate !== null && node.alternate.type === "ExpressionsStatement") {
            node.alternate = wrapAsBlock(node.alternate);
        }

        // instrument on block level
        if (node.consequent.type === "BlockStatement") {
            var costCtrStmt = getFreshCostCtrStmt();
            node.consequent.body.splice(0, 0, costCtrStmt);
        }
        if (node.alternate !== null && node.alternate.type === "BlockStatement") {
            var costCtrStmt2 = getFreshCostCtrStmt();
            node.alternate.body.splice(0, 0, costCtrStmt2);
        }
    }

    function getFreshStringLiteralExpr(str) {
        return esprima.parse("\"" + str + "\"").body[0];
    }

    function getFreshCostCtrStmt() {
        return esprima.parse("if (typeof " + globalCostVarName + " !== 'undefined')" + globalCostVarName + "++;").body[0];
    }

    function wrapAsBlock(exprStmt) {
        return {
            type:"BlockStatement",
            body:[
                exprStmt
            ]
        };
    }

    function isIgnoredNode(node) {
        var line = -1;
        var column = -1;
        if (node && node.loc) {
            line = node.loc.start.line;
            column = node.loc.start.column + 1; // plus one because esprima starts at column 0
        }
        var traceEntry = shortFileName + ":" + line + ":" + column;
        var ignore = traceEntriesToIgnore.indexOf(traceEntry) !== -1;
        if (ignore)
            console.log("Will ignore for instrumentation: " + traceEntry);
        return ignore;
    }

    function shortenFileName(fileName) {
        var relName = fileName;
        var slashIdx = fileName.lastIndexOf("/");
        if (slashIdx >= 0) {
            relName = relName.slice(slashIdx + 1);
        }
        return relName;
    }

    // main part
    loadUsedNames();
    var fileName = process.argv[2];
    var shortFileName = shortenFileName(fileName);
    var code = fs.readFileSync(fileName, "utf8");
    var markedCode = instrumentFunctions(code);
    var newFileName = fileName.replace(/\.js$/, fileSuffix + ".js");
    fs.writeFileSync(newFileName, markedCode, "utf8");
    storeUsedNames();
    console.log(fileName + " --> " + newFileName);

})();
