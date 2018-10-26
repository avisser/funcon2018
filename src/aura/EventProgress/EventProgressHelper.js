({
    sortStatuses: function(statuses) {
        return statuses.sort(function(a, b) {
            return a.EventApi__Order__c < b.EventApi__Order__c
        })
    }
})