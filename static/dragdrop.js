dragDropMethods = {
    startDragToken(e, token) {

    e.dataTransfer.setData("text/plain", token.text);
    e.dataTransfer.setData("tokenId", token.id);
},
startDragText(e) {
    e.dataTransfer.setData("text/plain", this.extractedText);
},
dropTo(field) {
    return (e) => {
        const text = e.dataTransfer.getData("text/plain");
        this[field] = text.toUpperCase();
        this.showPopup = false;
        console.log("Dropped text to", field, ":", text);
    };
},
dropField(e, field) {

    const text =
        e.dataTransfer.getData("text/plain");

    this[field] = text.toUpperCase();
},
removeDraggedToken(e) {

    const tokenId = e.dataTransfer.getData("tokenId");

    this.ocrTokens =
        this.ocrTokens.filter(
            t => t.id != tokenId
        );
},
pasteToFocused() {

    const el = document.activeElement;

    if (!el) return;

    if (
        el.tagName === "INPUT" ||
        el.tagName === "TEXTAREA"
    ) {

        // insert at cursor
        const start = el.selectionStart;
        const end = el.selectionEnd;

        const value = el.value;

        el.value =
            value.substring(0, start) +
            this.activeClipboard +
            value.substring(end);

        // move cursor
        const pos = start + this.activeClipboard.length;

        el.selectionStart = pos;
        el.selectionEnd = pos;

        // update Vue
        el.dispatchEvent(new Event("input"));
    }
},
copyToSystemClipboard(text) {
    navigator.clipboard.writeText(text);
}
}