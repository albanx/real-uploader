/**
 */

define(['AreaSelector'], function(AreaSelector) {

    describe('AreaSelector', function() {
        var imageEditorInstance;

        beforeEach(function() {
            imageEditorInstance = new AreaSelector();
        });

        it('is defined', function() {
            expect(imageEditorInstance instanceof AreaSelector).toBe(true);
        });

        it('createDragSelector create div', function() {
            var div = imageEditorInstance.createDragSelector(0, 0);
            expect(div.tagName === 'DIV').toBe(true);
        });

        it('createArea create div', function() {
            var div = imageEditorInstance.createArea(0, 0);
            expect(div.tagName === 'DIV').toBe(true);
        });

        it('createSelectors return object with 8 elements', function() {
            var selectors = imageEditorInstance.createSelectors(10, 10);
            expect(Object.keys(selectors).length).toBe(8);

        });
    });


});

