({
    doInit: function (cmp, evt, helper) {
        var action = cmp.get('c.getProgress');
        action.setParams({
            eventId: cmp.get('v.recordId')
        });
        action.setCallback(this, function (result) {
            if (result.getState() === 'ERROR') {
                result.getError().forEach(function (error) {
                    var toastEvent = $A.get("e.force:showToast");
                    toastEvent.setParams({
                        title: "Error calling getProgress",
                        message: error.message,
                        type: "error"
                    });
                    // toastEvent.fire();
                });
            }
            else {
                var retVal = result.getReturnValue();
                cmp.set('v.sold', retVal.ticketsSold > 0 ? retVal.ticketsSold : 15);
                cmp.set('v.remaining', retVal.ticketsRemaining);

                var status = cmp.find('status');

                cmp.set('v.currentStatus', retVal.currentStatus);
                cmp.set('v.statuses', helper.sortStatuses(retVal.statuses));
            }
        });

        $A.enqueueAction(action);
    }
})