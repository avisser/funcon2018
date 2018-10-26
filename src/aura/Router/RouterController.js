({
    doInit: function (cmp, event, helper) {
        if (!window.routerCallbacks) {
            //I'm the first router on the page
            window.addEventListener('message', function (event) {
                if (event.data && event.data.key === 'fon.log' || event.data === 'log' || event.data.log !== undefined) {
                    if (event.data.log !== undefined && !event.data.log) {
                        sessionStorage.removeItem('log');
                        console.log("disabling logging");
                    }
                    else {
                        var logLevel = event.data.log || event.data.value || "debug";
                        sessionStorage.setItem('fon.log', logLevel);
                        console.log("logging level: " + logLevel);
                    }
                }
                if (event.data && event.data.key === 'mock' || event.data === 'mock' || event.data.mock !== undefined) {
                    if (event.data.mock !== undefined && !event.data.mock) {
                        sessionStorage.removeItem('mock');
                        console.log("disabling mock data service");
                    }
                    else {
                        sessionStorage.setItem('mock', 'enabled');
                        console.log("enabling mock data service");
                    }
                }
                if (event.data && event.data.scenario !== undefined) {
                    if (event.data.scenario) {
                        sessionStorage.setItem('mock', 'enabled'); //value doesn't matter
                        sessionStorage.setItem('scenario', event.data.scenario);
                        console.log("use mock data scenario: " + event.data.scenario);
                    }
                    else {
                        sessionStorage.removeItem('scenario');
                        console.log("disabling scenario mode");
                    }
                }
            });
        }
        window.routerCallbacks = window.routerCallbacks || {};
        window.routerCallbacks[cmp.getName()] = $A.getCallback(function () {
            if (cmp.isValid()) {
                helper.onHashChange(cmp);
            }
            else {
                //this shouldn't happen
                console.info('callback for an invalid cmp');
            }
        });
        window.addEventListener("hashchange", window.routerCallbacks[cmp.getName()], false);

        if (cmp.get('v.doChange')) {
            helper.onHashChange(cmp);
        }
    },
    setRoutes: function (cmp, event, helper) {
        var params = event.getParam('arguments');
        cmp.set('v.routesJson', params.routesJson);
        cmp.set('v.parentCmp', params.parentCmp);
        cmp.set('v.onRenderCallback', params.onRenderCallback || false);
        cmp.set('v.helper', params.helper || false);
        if (typeof(_) === "undefined") {
            cmp.set('v.doChange', true);
        }
        else {
            helper.onHashChange(cmp);
        }
    },
    handleDestroy: function (cmp, event, helper) {
        window.removeEventListener("hashchange", window.routerCallbacks[cmp.getName()], false);
    }
})