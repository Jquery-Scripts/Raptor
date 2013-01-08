/**
 * @fileOverview Selection manipulation helper functions.
 * @author David Neilsen david@panmedia.co.nz
 * @author Michael Robinson michael@panmedia.co.nz
 */
/**
 * @type {Boolean|Object} current saved selection.
 */
var savedSelection = false;

/**
 * Save selection wrapper, preventing plugins / UI from accessing rangy directly.
 */
function selectionSave(overwrite) {
    if (savedSelection && !overwrite) return;
    savedSelection = rangy.saveSelection();
}

/**
 * Restore selection wrapper, preventing plugins / UI from accessing rangy directly.
 */
function selectionRestore() {
    if (savedSelection) {
        rangy.restoreSelection(savedSelection);
        savedSelection = false;
    }
}

/**
 * Reset saved selection.
 */
function selectionDestroy() {
    if (savedSelection) {
        rangy.removeMarkers(savedSelection);
    }
    savedSelection = false;
}

function selectionSaved() {
    return savedSelection !== false;
}

/**
 * Iterates over all ranges in a selection and calls the callback for each
 * range. The selection/range offsets is updated in every iteration in in the
 * case that a range was changed or removed by a previous iteration.
 *
 * @public @static
 * @param {function} callback The function to call for each range. The first and only parameter will be the current range.
 * @param {RangySelection} [selection] A RangySelection, or by default, the current selection.
 * @param {object} [context] The context in which to call the callback.
 */
function selectionEachRange(callback, selection, context) {
    selection = selection || rangy.getSelection();
    var range, i = 0;
    // Create a new range set every time to update range offsets
    while (range = selection.getAllRanges()[i++]) {
        callback.call(context, range);
    }
}

function selectionSet(mixed) {
    rangy.getSelection().setSingleRange(mixed);
}

/**
 * Replaces the given selection (or the current selection if selection is not
 * supplied) with the given html.
 *
 * @public @static
 * @param  {jQuery|String} html The html to use when replacing.
 * @param  {RangySelection|null} selection The selection to replace, or null to replace the current selection.
 */
function selectionReplace(html, selection) {
    var result = [];
    selectionEachRange(function(range) {
        result.concat(rangeReplace(html, range));
    }, selection, this);
    return result;
}

/**
 * Selects all the contents of the supplied element, excluding the element itself.
 *
 * @public @static
 * @param {jQuerySelector|jQuery|Element} element
 * @param {RangySelection} [selection] A RangySelection, or by default, the current selection.
 */
function selectionSelectInner(element, selection) {
    selection = selection || rangy.getSelection();
    selection.removeAllRanges();
    $(element).focus().contents().each(function() {
        var range = rangy.createRange();
        range.selectNodeContents(this);
        selection.addRange(range);
    });
}

/**
 * Selects all the contents of the supplied element, including the element itself.
 *
 * @public @static
 * @param {jQuerySelector|jQuery|Element} element
 * @param {RangySelection} [selection] A RangySelection, or null to use the current selection.
 */
function selectionSelectOuter(element, selection) {
    selection = selection || rangy.getSelection();
    selection.removeAllRanges();
    $(element).each(function() {
        var range = rangy.createRange();
        range.selectNode(this);
        selection.addRange(range);
    }).focus();
}

/**
 * Move selection to the start or end of element.
 *
 * @param  {jQuerySelector|jQuery|Element} element The subject element.
 * @param  {RangySelection|null} selection A RangySelection, or null to use the current selection.
 * @param {Boolean} start True to select the start of the element.
 */
function selectionSelectEdge(element, selection, start) {
    selection = selection || rangy.getSelection();
    selection.removeAllRanges();

    $(element).each(function() {
        var range = rangy.createRange();
        range.selectNodeContents(this);
        range.collapse(start);
        selection.addRange(range);
    });
}

/**
 * Move selection to the end of element.
 *
 * @param  {jQuerySelector|jQuery|Element} element The subject element.
 * @param  {RangySelection|null} selection A RangySelection, or null to use the current selection.
 */
function selectionSelectEnd(element, selection) {
    selectionSelectEdge(element, selection, false);
}

/**
 * Move selection to the start of element.
 *
 * @param  {jQuerySelector|jQuery|Element} element The subject element.
 * @param  {RangySelection|null} selection A RangySelection, or null to use the current selection.
 */
function selectionSelectStart(element, selection) {
    selectionSelectEdge(element, selection, true);
}

/**
 * @param  {RangySelection|null} selection Selection to get html from or null to use current selection.
 * @return {string} The html content of the selection.
 */
function selectionGetHtml(selection) {
    selection = selection || rangy.getSelection();
    return selection.toHtml();
}

function selectionGetElement(range) {
    var commonAncestor;

    range = range || rangy.getSelection().getRangeAt(0);

    // Check if the common ancestor container is a text node
    if (range.commonAncestorContainer.nodeType === 3) {
        // Use the parent instead
        commonAncestor = range.commonAncestorContainer.parentNode;
    } else {
        commonAncestor = range.commonAncestorContainer;
    }
    return $(commonAncestor);
}

/**
 * Gets all elements that contain a selection (excluding text nodes) and
 * returns them as a jQuery array.
 *
 * @public @static
 * @param {RangySelection} [sel] A RangySelection, or by default, the current selection.
 */
function selectionGetElements(selection) {
    var result = new jQuery();
    selectionEachRange(function(range) {
        result.push(selectionGetElement(range)[0]);
    }, selection, this);
    return result;
}

function selectionGetStartElement() {
    var selection = rangy.getSelection();
    if (selection.anchorNode === null) {
        return null;
    }
    if (selection.isBackwards()) {
        return selection.focusNode.nodeType === 3 ? $(selection.focusNode.parentElement) : $(selection.focusNode);
    }
    if (!selection.anchorNode) console.trace();
    return selection.anchorNode.nodeType === 3 ? $(selection.anchorNode.parentElement) : $(selection.anchorNode);
}

function selectionGetEndElement() {
    var selection = rangy.getSelection();
    if (selection.anchorNode === null) {
        return null;
    }
    if (selection.isBackwards()) {
        return selection.anchorNode.nodeType === 3 ? $(selection.anchorNode.parentElement) : $(selection.anchorNode);
    }
    return selection.focusNode.nodeType === 3 ? $(selection.focusNode.parentElement) : $(selection.focusNode);
}

function selectionAtEndOfElement() {
    var selection = rangy.getSelection();
    var focusNode = selection.isBackwards() ? selection.anchorNode : selection.focusNode;
    var focusOffset = selection.isBackwards() ? selection.focusOffset : selection.anchorOffset;
    if (focusOffset !== focusNode.textContent.length) {
        return false;
    }
    var previous = focusNode.nextSibling;
    if (!previous || $(previous).html() === '') {
        return true;
    } else {
        return false;
    }
}

function selectionAtStartOfElement() {
    var selection = rangy.getSelection();
    var anchorNode = selection.isBackwards() ? selection.focusNode : selection.anchorNode;
    if (selection.isBackwards() ? selection.focusOffset : selection.anchorOffset !== 0) {
        return false;
    }
    var previous = anchorNode.previousSibling;
    if (!previous || $(previous).html() === '') {
        return true;
    } else {
        return false;
    }
}

function selectionIsEmpty() {
    return rangy.getSelection().toHtml() === '';
}

/**
 * FIXME: this function needs reviewing
 *
 * This should toggle an inline style, and normalise any overlapping tags, or adjacent (ignoring white space) tags.
 *
 * @public @static
 */
function selectionToggleWrapper(tag, options) {
    options = options || {};
    var applier = rangy.createCssClassApplier(options.classes || '', {
        normalize: true,
        elementTagName: tag,
        elementProperties: options.attributes || {}
    });
    selectionEachRange(function(range) {
        if (rangeEmptyTag(range)) {
            var element = $('<' + tag + '/>')
                .addClass(options.classes)
                .attr(options.attributes || {})
                .append(fragmentToHtml(range.cloneContents()));
            rangeReplace(element, range);
        } else {
            applier.toggleRange(range);
        }
    }, null, this);
}

function selectionWrapTagWithAttribute(tag, attributes, classes) {
    selectionEachRange(function(range) {
        var element = selectionGetElement(range);
        if (element.is(tag)) {
            element.attr(attributes);
        } else {
            selectionToggleWrapper(tag, {
                classes: classes,
                attributes: attributes
            });
        }
    }, null, this);
}

/**
 * Returns true if there is at least one range selected and the range is not
 * empty.
 *
 * @see rangeIsEmpty
 * @public @static
 * @param {RangySelection} [selection] A RangySelection, or by default, the current selection.
 */
function selectionExists(sel) {
    var exists = false;
    selectionEachRange(function(range) {
        if (!rangeIsEmpty(range)) {
            exists = true;
        }
    }, sel, this);
    return exists;
}

/**
 * Split the selection container and insert the given html between the two elements created.
 * @param  {jQuery|Element|string} html The html to replace selection with.
 * @param  {RangySelection|null} selection The selection to replace, or null for the current selection.
 */
function selectionReplaceSplittingSelectedElement(html, selection) {
    selection = selection || rangy.getSelection();

    var selectionRange = selection.getRangeAt(0);
    var selectedElement = selectionGetElements()[0];

    // Select from start of selected element to start of selection
    var startRange = rangy.createRange();
    startRange.setStartBefore(selectedElement);
    startRange.setEnd(selectionRange.startContainer, selectionRange.startOffset);
    var startFragment = startRange.cloneContents();

    // Select from end of selected element to end of selection
    var endRange = rangy.createRange();
    endRange.setStart(selectionRange.endContainer, selectionRange.endOffset);
    endRange.setEndAfter(selectedElement);
    var endFragment = endRange.cloneContents();

    // Replace the start element's html with the content that was not selected, append html & end element's html
    var replacement = elementOuterHtml($(fragmentToHtml(startFragment)));
    replacement += elementOuterHtml($(html).attr('data-replacement', true));
    replacement += elementOuterHtml($(fragmentToHtml(endFragment)));

    replacement = $(replacement);

    $(selectedElement).replaceWith(replacement);
    return replacement.parent().find('[data-replacement]').removeAttr('data-replacement');
}

/**
 * Replace current selection with given html, ensuring that selection container is split at
 * the start & end of the selection in cases where the selection starts / ends within an invalid element.
 * @param  {jQuery|Element|string} html The html to replace current selection with.
 * @param  {Array} validTagNames An array of tag names for tags that the given html may be inserted into without having the selection container split.
 * @param  {RangySeleciton|null} selection The selection to replace, or null for the current selection.
 */
function selectionReplaceWithinValidTags(html, validTagNames, selection) {
    selection = selection || rangy.getSelection();
    if (selection.rangeCount === 0) {
        return;
    }

    var startElement = selectionGetStartElement()[0];
    var endElement = selectionGetEndElement()[0];
    var selectedElement = selectionGetElements()[0];

    var selectedElementValid = elementIsValid(selectedElement, validTagNames);
    var startElementValid = elementIsValid(startElement, validTagNames);
    var endElementValid = elementIsValid(endElement, validTagNames);

    // The html may be inserted within the selected element & selection start / end.
    if (selectedElementValid && startElementValid && endElementValid) {
        return selectionReplace(html);
    }

    // Context is invalid. Split containing element and insert list in between.
    return selectionReplaceSplittingSelectedElement(html, selection);
}

/**
 * Toggles style(s) on the first block level parent element of each range in a selection
 *
 * @public @static
 * @param {Object} styles styles to apply
 * @param {jQuerySelector|jQuery|Element} limit The parent limit element.
 * If there is no block level elements before the limit, then the limit content
 * element will be wrapped with a "div"
 */
function selectionToggleBlockStyle(styles, limit) {
    selectionEachRange(function(range) {
        var parent = $(range.commonAncestorContainer);
        while (parent.length && parent[0] !== limit[0] && (
                parent[0].nodeType === 3 || parent.css('display') === 'inline')) {
            parent = parent.parent();
        }
        if (parent[0] === limit[0]) {
            // Only apply block style if the limit element is a block
            if (limit.css('display') !== 'inline') {
                // Wrap the HTML inside the limit element
                elementWrapInner(limit, 'div');
                // Set the parent to the wrapper
                parent = limit.children().first();
            }
        }
        // Apply the style to the parent
        elementToggleStyle(parent, styles);
    }, null, this);
}

function selectionEachBlock(callback, limitElement, blockContainer) {
    // <strict>
    if (!$.isFunction(callback)) {
        handleError('Paramter 1 to selectionEachBlock is expected to be a function');
        return;
    }
    if (!(limitElement instanceof jQuery)) {
        handleError('Paramter 2 to selectionEachBlock is expected a jQuery element');
        return;
    }
    if (typeof blockContainer !== 'undefined' && typeof blockContainer !== 'string') {
        handleError('Paramter 3 to selectionEachBlock is expected be undefined or a string');
        return;
    }
    // </strict>
    selectionEachRange(function(range) {
        // Loop range parents until a block element is found, or the limit element is reached
        var startBlock = elementClosestBlock($(range.startContainer), limitElement),
            endBlock = elementClosestBlock($(range.endContainer), limitElement),
            blocks;
        if (!startBlock || !endBlock) {
            // Wrap the HTML inside the limit element
            callback(elementWrapInner(limitElement, blockContainer).get(0));
        } else {
            if (startBlock.is(endBlock)) {
                blocks = startBlock;
            } else if (startBlock && endBlock) {
                blocks = startBlock.nextUntil(endBlock).andSelf().add(endBlock);
            }
            for (var i = 0, l = blocks.length; i < l; i++) {
                callback(blocks[i]);
            }
        }
    });
}

/**
 * Add or removes a set of classes to the closest block elements in a selection.
 * If the `limitElement` is closer than a block element, then a new
 * `blockContainer` element wrapped around the selection.
 *
 * If any block in the selected text has not got the class applied to it, then
 * the class will be applied to all blocks.
 *
 *
 * @param {string[]} addClasses
 * @param {string[]} removeClasses
 * @param {type} limitElement
 * @param {type} blockContainer
 * @returns {undefined}
 */
function selectionToggleBlockClasses(addClasses, removeClasses, limitElement, blockContainer) {
    // <strict>
    if (!$.isArray(addClasses)) {
        handleError('Paramter 1 to selectionToggleBlockClasses is expected to be an array of classes');
        return;
    }
    if (!$.isArray(removeClasses)) {
        handleError('Paramter 2 to selectionToggleBlockClasses is expected to be an array of classes');
        return;
    }
    if (!(limitElement instanceof jQuery)) {
        handleError('Paramter 3 to selectionToggleBlockClasses is expected a jQuery element');
        return;
    }
    if (typeof blockContainer !== 'undefined' && typeof blockContainer !== 'string') {
        handleError('Paramter 4 to selectionToggleBlockClasses is expected be undefined or a string');
        return;
    }
    // </strict>

    var apply = false,
        blocks = new jQuery();

    selectionEachBlock(function(block) {
        blocks.push(block);
        if (!apply) {
            for (var i = 0, l = addClasses.length; i < l; i++) {
                if (!$(block).hasClass(addClasses[i])) {
                    apply = true;
                }
            }
        }
    }, limitElement, blockContainer);

    $(blocks).removeClass(removeClasses.join(' '));
    if (apply) {
        $(blocks).addClass(addClasses.join(' '));
    } else {
        $(blocks).removeClass(addClasses.join(' '));
    }
}

/**
 * Removes all ranges from a selection that are not contained within the
 * supplied element.
 *
 * @public @static
 * @param {jQuerySelector|jQuery|Element} element
 * @param {RangySelection} [selection]
 */
function selectionConstrain(element, selection) {
    element = $(element)[0];
    selection = selection || rangy.getSelection();

    if (!selection) {
        selectionSelectStart(element);
        return;
    }

    var commonAncestor;
    $(selection.getAllRanges()).each(function(i, range){
        if (this.commonAncestorContainer.nodeType === 3) {
            commonAncestor = $(range.commonAncestorContainer).parent()[0];
        } else {
            commonAncestor = range.commonAncestorContainer;
        }
        if (element !== commonAncestor && !$.contains(element, commonAncestor)) {
            selection.removeRange(range);
        }
    });
}


function selectionClearFormatting(limitNode, selection) {
    limitNode = limitNode || document.body;
    selection = selection || rangy.getSelection();
    if (selection.rangeCount > 0) {
        // Create a copy of the selection range to work with
        var range = selection.getRangeAt(0).cloneRange();

        // Get the selected content
        var content = range.extractContents();

        // Expand the range to the parent if there is no selected content
        if (fragmentToHtml(content) === '') {
            rangeExpandToParent(range);
            selection.setSingleRange(range);
            content = range.extractContents();
        }

        content = $('<div/>').append(fragmentToHtml(content)).text();

        // Get the containing element
        var parent = range.commonAncestorContainer;
        while (parent && parent.parentNode != limitNode) {
            parent = parent.parentNode;
        }

        if (parent) {
            // Place the end of the range after the paragraph
            range.setEndAfter(parent);

            // Extract the contents of the paragraph after the caret into a fragment
            var contentAfterRangeStart = range.extractContents();

            // Collapse the range immediately after the paragraph
            range.collapseAfter(parent);

            // Insert the content
            range.insertNode(contentAfterRangeStart);

            // Move the caret to the insertion point
            range.collapseAfter(parent);
            range.insertNode(document.createTextNode(content));
        } else {
            range.insertNode(document.createTextNode(content));
        }
    }
}



function selectionInverseWrapWithTagClass(tag1, class1, tag2, class2) {
    selectionSave();
    // Assign a temporary tag name (to fool rangy)
    var id = 'domTools' + Math.ceil(Math.random() * 10000000);

    selectionEachRange(function(range) {
        var applier2 = rangy.createCssClassApplier(class2, {
            elementTagName: tag2
        });

        // Check if tag 2 is applied to range
        if (applier2.isAppliedToRange(range)) {
            // Remove tag 2 to range
            applier2.toggleSelection();
        } else {
            // Apply tag 1 to range
            rangy.createCssClassApplier(class1, {
                elementTagName: id
            }).toggleSelection();
        }
    }, null, this);

    // Replace the temparay tag with the correct tag
    $(id).each(function() {
        $(this).replaceWith($('<' + tag1 + '/>').addClass(class1).html($(this).html()));
    });

    selectionRestore();
}

function selectionExpandToWord() {
    var ranges = rangy.getSelection().getAllRanges();
    if (ranges.length === 1) {
        if (ranges[0].toString() === '') {
            rangy.getSelection().expand('word');
        }
    }
}

function selectionFindWrappingAndInnerElements(selector, limitElement) {
    var result = new jQuery();
    selectionEachRange(function(range) {
        var startNode = range.startContainer;
        while (startNode.nodeType === Node.TEXT_NODE) {
            startNode = startNode.parentNode;
        }

        var endNode = range.endContainer;
        while (endNode.nodeType === Node.TEXT_NODE) {
            endNode = endNode.parentNode;
        }

        var filter = function() {
            if (!limitElement.is(this)) {
                result.push(this);
            }
        };

        do {
            $(startNode).filter(selector).each(filter);

            if (!limitElement.is(startNode)) {
                $(startNode).parentsUntil(limitElement, selector).each(filter);
            }

            $(startNode).find(selector).each(filter);

            if ($(endNode).is(startNode)) {
                break;
            }

            startNode = $(startNode).next();
        } while (startNode.length > 0 && $(startNode).prevAll().has(endNode).length === 0);
    });
    return result;
}

function selectionChangeTags(changeTo, changeFrom, limitElement) {
    selectionSave();
    var elements = selectionFindWrappingAndInnerElements(changeFrom.join(','), limitElement);
    if (elements.length) {
        elementChangeTag(elements, changeTo);
    } else {
        var limitNode = limitElement.get(0);
        limitNode.innerHTML = '<' + changeTo + '>' + limitNode.innerHTML + '</' + changeTo + '>';
    }
    selectionRestore();
}
