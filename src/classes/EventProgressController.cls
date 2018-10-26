public with sharing class EventProgressController {
    public class Results {
        @AuraEnabled
        public List<EventApi__Event_Status__c> statuses = new List<EventApi__Event_Status__c>();
        @AuraEnabled
        public String currentStatus;
        @AuraEnabled
        public Integer ticketsSold;
        @AuraEnabled
        public Integer ticketsRemaining;
    }

    @AuraEnabled
    public static Results getProgress(String eventId) {
        Results retVal = new Results();

        EventApi__Event__c event = (EventApi__Event__c)new Framework.Selector(EventApi__Event__c.SObjectType).selectById(eventId);

        retVal.currentStatus = event.EventApi__Status__c;
        retVal.ticketsSold = (Integer) event.EventApi__Quantity_Sold__c;
        retVal.ticketsRemaining = (Integer) event.EventApi__Quantity_Remaining__c;


//        retVal.statuses = new Framework.Selector(EventApi__Event_Status__c.SObjectType, 'EventApi__Event__c = :eventId').getAll();
        retVal.statuses = Database.query(new Framework.Selector(EventApi__Event_Status__c.SObjectType, 'EventApi__Event__c = :eventId').buildQueryStatement());

        return retVal;
    }

}