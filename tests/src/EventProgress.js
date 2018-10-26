require("../includes")(this);

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

    describe('Run handleFieldChangeEvent method', function () {
        it('should set the body and run helper.findAccounts', function () {
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

