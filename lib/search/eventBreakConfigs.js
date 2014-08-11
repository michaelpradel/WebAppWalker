(function() {

    function getConfig() {
        // >>>>>>> Modify this to setup EventBreak for another benchmark <<<<<<<<<<<
//        return exampleAppRandomConfig;                            // simple example app (first phase)
        return exampleAppTargetedAfterRandomConfig;               // simple example app (second phase)

//        return joomlaMenusModulesTargetedAfterManualConfig;       // ID 1 in OOPSLA paper (second phase)

//        return joomlaCategoriesTargetedAfterManualConfig;         // ID 2 in OOPSLA paper (second phase)

//        return drupalArticlesTargetedAfterManualConfig;           // ID 3 in OOPSLA paper (second phase)

//        return todolistTargetedAfterManualConfig;                 // ID 4 in OOPSLA paper (second phase)

//        return joomlaMenusModulesRandomConfig;                    // ID 5 in OOPSLA paper (first phase)
//        return joomlaMenusModulesTargetedAfterRandomConfig;       // ID 5 in OOPSLA paper (second phase)

//        return joomlaCategoriesRandomConfig;                      // ID 6 in OOPSLA paper (first phase)
//        return joomlaCategoriesTargetedAfterRandomConfig;         // ID 6 in OOPSLA paper (second phase)

//        return drupalArticlesRandomConfig;                        // ID 7 in OOPSLA paper (first phase)
//        return drupalArticlesTargetedAfterRandomConfig;           // ID 7 in OOPSLA paper (second phase)

//        return todolistRandomConfig;                              // ID 8 in OOPSLA paper (first phase)
//        return todolistTargetedAfterRandomConfig;                 // ID 8 in OOPSLA paper (second phase)
    }

    // ========== example app (start) ==================
    var exampleAppRandomConfig = {
        isOnURLWhitelist:function(url) {
            return true;
        },
        stateAbstraction:function(title, url) {
            return [title, url];
        },
        triggerIfHanging:true,
        maxHistoryLength:500
    };
    addRandomPhaseProps(exampleAppRandomConfig);

    var exampleAppTargetedAfterRandomConfig = {
        isOnURLWhitelist:function(url) {
            return true;
        },
        stateAbstraction:function(title, url) {
            return [title, url];
        },
        triggerIfHanging:true,
        historyInFile:"/currentHistory_extended.json",
        rulesInFile:"/rules.json"
    };
    addTargetedPhaseProps(exampleAppTargetedAfterRandomConfig);
    // ========== example app (end) ==================


    // ========== joomla (start) ==================
    function addJoomlaProps(config) {
        function filterURL(url) {
            if (!url)
                return url;
            // for Joomla: ignore id parameter, which refers to specific menu items, users, etc.
            url = url.replace(/id=[0-9][0-9]*/, "id=someId").replace(/id%3D[0-9][0-9]*/, "id=someId").replace(/id%3d[0-9][0-9]*/, "id=someId");
            return url;
        }
        config.stateAbstraction = function(title, url) {
            return [title, filterURL(url)];
        };
        config.triggerIfHanging = false;
    }

    var joomlaMenusModulesRandomConfig = {
        isOnURLWhitelist:function(url) {
            if (url.indexOf("option=com_menus") !== -1)
                return true;
            if (url.indexOf("option=com_modules") !== -1)
                return true;
            return false;
        },
        maxHistoryLength:5000
    };
    addJoomlaProps(joomlaMenusModulesRandomConfig);
    addRandomPhaseProps(joomlaMenusModulesRandomConfig);

    var joomlaMenusModulesTargetedAfterRandomConfig = {
        isOnURLWhitelist:function(url) {
            if (url.indexOf("option=com_menus") !== -1)
                return true;
            if (url.indexOf("option=com_modules") !== -1)
                return true;
            return false;
        },
        historyInFile:"/EventBreak_Results/joomla/menus_modules_automatic/history.json",
        rulesInFile:"/EventBreak_Results/joomla/menus_modules_automatic/rules.json"
    };
    addJoomlaProps(joomlaMenusModulesTargetedAfterRandomConfig);
    addTargetedPhaseProps(joomlaMenusModulesTargetedAfterRandomConfig);

    var joomlaMenusModulesTargetedAfterManualConfig = {
        isOnURLWhitelist:function(url) {
            if (url.indexOf("option=com_menus") !== -1)
                return true;
            if (url.indexOf("option=com_modules") !== -1)
                return true;
            return false;
        },
        historyInFile:"/EventBreak_Results/joomla/menus_modules_manual/history.json",
        rulesInFile:"/EventBreak_Results/joomla/menus_modules_manual/rules.json"
    };
    addJoomlaProps(joomlaMenusModulesTargetedAfterManualConfig);
    addTargetedPhaseProps(joomlaMenusModulesTargetedAfterManualConfig);

    var joomlaCategoriesTargetedAfterManualConfig = {
        isOnURLWhitelist:function(url) {
            if (url.indexOf("option=com_categories") !== -1)
                return true;
            return false;
        },
        historyInFile:"/EventBreak_Results/joomla/categories_manual/history.json",
        rulesInFile:"/EventBreak_Results/joomla/categories_manual/rules.json"
    };
    addJoomlaProps(joomlaCategoriesTargetedAfterManualConfig);
    addTargetedPhaseProps(joomlaCategoriesTargetedAfterManualConfig);

    var joomlaCategoriesRandomConfig = {
        isOnURLWhitelist:function(url) {
            if (url.indexOf("option=com_categories") !== -1)
                return true;
            return false;
        },
        maxHistoryLength:5000
    };
    addJoomlaProps(joomlaCategoriesRandomConfig);
    addRandomPhaseProps(joomlaCategoriesRandomConfig);

    var joomlaCategoriesTargetedAfterRandomConfig = {
        isOnURLWhitelist:function(url) {
            if (url.indexOf("option=com_categories") !== -1)
                return true;
            return false;
        },
        historyInFile:"/EventBreak_Results/joomla/categories_automatic/history.json",
        rulesInFile:"/EventBreak_Results/joomla/categories_automatic/rules.json"
    };
    addJoomlaProps(joomlaCategoriesTargetedAfterRandomConfig);
    addTargetedPhaseProps(joomlaCategoriesTargetedAfterRandomConfig);
    // ========== joomla (end) ==================


    // ========== drupal (start) ==================
    function addDrupalProps(config) {
        function filterURL(url) {
            if (!url)
                return url;
            // for Drupal: ignore ids of articles, etc.
            url = url.replace(/drupal\/node\/[0-9][0-9]*/, "drupal/node/someId");
            return url;
        }
        config.stateAbstraction = function(title, url) {
            return ["", filterURL(url)];
        };
        config.triggerIfHanging = false;
        config.isOnURLWhitelist = function(url) {
            if (url.indexOf("drupal/admin/content") !== -1)
                return true;
            return false;
        };
    }

    var drupalArticlesTargetedAfterManualConfig = {
        historyInFile:"/EventBreak_Results/drupal/articles_manual/history.json",
        rulesInFile:"/EventBreak_Results/drupal/articles_manual/rules.json"
    };
    addDrupalProps(drupalArticlesTargetedAfterManualConfig);
    addTargetedPhaseProps(drupalArticlesTargetedAfterManualConfig);

    var drupalArticlesRandomConfig = {
        maxHistoryLength:5000
    };
    addDrupalProps(drupalArticlesRandomConfig);
    addRandomPhaseProps(drupalArticlesRandomConfig);
    
    var drupalArticlesTargetedAfterRandomConfig = {
        historyInFile:"/EventBreak_Results/drupal/articles_automatic/history.json",
        rulesInFile:"/EventBreak_Results/drupal/articles_automatic/rules.json"
    };
    addDrupalProps(drupalArticlesTargetedAfterRandomConfig);
    addTargetedPhaseProps(drupalArticlesTargetedAfterRandomConfig);
    // ========== drupal (end) ==================


    // ========== todolist (start) ==================
    function addTodolistProps(config) {
        config.stateAbstraction = function(title, url) {
            return [title, ""];
        };
        config.isOnURLWhitelist = function(url) {
            return true;
        };
        config.triggerIfHanging = true;
    }

    var todolistRandomConfig = {
        maxHistoryLength:1000
    };
    addTodolistProps(todolistRandomConfig);
    addRandomPhaseProps(todolistRandomConfig);

    var todolistTargetedAfterRandomConfig = {
        historyInFile:"/EventBreak_Results/todolist/automatic/history.json",
        rulesInFile:"/EventBreak_Results/todolist/automatic/rules.json"
    };
    addTodolistProps(todolistTargetedAfterRandomConfig);
    addTargetedPhaseProps(todolistTargetedAfterRandomConfig);

    var todolistTargetedAfterManualConfig = {
        historyInFile:"/EventBreak_Results/todolist/manual/history.json",
        rulesInFile:"/EventBreak_Results/todolist/manual/rules.json"
    };
    addTodolistProps(todolistTargetedAfterRandomConfig);
    addTargetedPhaseProps(todolistTargetedAfterRandomConfig);
    // ========== todolist (end) ==================


    // ========== default configuration (start) ==================
    function addRandomPhaseProps(config) {
        config.historyInFile = "";
        config.historyOutFile = "/currentHistory.json";
        config.rulesInFile = "";
        config.candidatePairOutFile = "";
        config.minEvtsToSearchCandidates = Number.MAX_VALUE;
        config.historyStoreSampleRate = 20;
    }

    function addTargetedPhaseProps(config) {
        config.historyOutFile = "/currentHistory.json";
        config.candidatePairOutFile = "/exploredCandidatePairs.json";
        config.minEvtsToSearchCandidates = 10;
        config.maxHistoryLength = Number.MAX_VALUE;
        config.historyStoreSampleRate = 1;
    }
    // ========== default configuration (end) ==================


    // template for new configurations
    var emptyConfig = {
        stateAbstraction:function(title, url) {
            return [title, url];
        },
        isOnURLWhitelist:function(url) {
            return true;
        },
        triggerIfHanging:false,
        historyInFile:"",
        historyOutFile:"/currentHistory.json",
        rulesInFile:"",
        candidatePairOutFile:"/exploredCandidatePairs.json",
        minEvtsToSearchCandidates:Number.MAX_VALUE,
        maxHistoryLength:1000,
        historyStoreSampleRate:20
    };


    // export functions of this module
    function unwrapObject(object) {
        if (!object)
            return object;
        try {
            if (object.wrappedJSObject) {
                return object.wrappedJSObject;
            }
        } catch (e) {
            console.log("Problem w/ unwrapping: " + e.trace);
        }
        return object;
    }
    var module;
    if (typeof exports !== "undefined") {
        // export to code running in add-on context
        module = exports;
    } else {
        // export to code running in page context
        unwrapObject(window).$WAWEventBreakConfigs = {};
        module = unwrapObject(window).$WAWEventBreakConfigs;
    }

    module.getConfig = getConfig;
})();