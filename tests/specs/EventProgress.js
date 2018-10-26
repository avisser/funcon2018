const chai = require('chai');
const expect = chai.expect;
const sinon = require('sinon');
const sinonChai = require("sinon-chai");
chai.use(sinonChai);

const _ = require('lodash');

require('mocha-aura/ensurePath')();
const {frameworkAdapters} = require('mocha-fonteva-adapters');
const {
    apexCallFactory,
    apexSuccessResult,
    apexErrorResult,
    auraFactory,
    eventFactory,
    componentFactory,
    useComponentAdapters
} = require('mocha-aura/aura');


const controller = require('aura/EventProgress/EventProgressController');
const helper = require('aura/EventProgress/EventProgressHelper');


describe('EventProgressController', function () {
    before(function () {
        global._ = _;
        useComponentAdapters(frameworkAdapters);

        global.$A = auraFactory({});
    });

    // beforeEach(function () {
    //     component = componentFactory();
    //
    //     sinon.stub(helper, 'findAccounts');
    // });
    //
    // afterEach(function () {
    //     helper.findAccounts.restore();
    // });
    //
    // after(function () {
    //     clock.restore();
    //     global.$A = auraFactory();
    // });

    describe('Run doInit method', function () {
        it('should follow the happy path', function () {
            const event = eventFactory({});
            const getProgress = apexCallFactory(apexSuccessResult({
                ticketsSold: 20,
                ticketsRemaining: 10,
                currentStatus: 'Planned',
                statuses: [
                    {Name: 'Planned', EventApi__Order__c: 0},
                    {Name: 'Active', EventApi__Order__c: 1},
                    {Name: 'Closed', EventApi__Order__c: 2}
                ]
            }));
            const cmp = componentFactory({
                getProgress,
                value: {
                    recordId: '123456789123456789'
                }
            });
            controller.doInit(cmp, event, helper);

            expect(cmp.set).to.have.been.calledWith('v.sold', 20);
            // expect(helper.findAccounts).to.have.been.calledWith(cmp);
        });
        it('should show toast on error', function () {
            // const bodycomp = componentFactory({});
            // const event = eventFactory({
            //     fieldId: 'account'
            // });
            // const component = componentFactory({
            //     value: {
            //         account: '123456789123456789'
            //     },
            //     findMap: {bodycomp}
            // });
            // controller.handleFieldChangeEvent(component, event, helper);
            //
            // expect(bodycomp.set).to.have.been.calledWith('v.body', []);
            // expect(helper.findAccounts).to.have.been.calledWith(component);
        });
    });
});

