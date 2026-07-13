canvasMethods = {
    startRect(e) {

    if (!this.canvas) return;

    if (e.button !== 0) return;

    const rect =
        this.canvas.getBoundingClientRect();

    this.startX =
        (e.clientX - rect.left) *
        (this.canvas.width / rect.width);

    this.startY =
        (e.clientY - rect.top) *
        (this.canvas.height / rect.height);

    this.isDrawing = true;
},
drawRect(e) {

    if (!this.isDrawing) return;

    const rect =
        this.canvas.getBoundingClientRect();

    const currX =
        (e.clientX - rect.left) *
        (this.canvas.width / rect.width);

    const currY =
        (e.clientY - rect.top) *
        (this.canvas.height / rect.height);

    this.ctx.clearRect(
        0,
        0,
        this.canvas.width,
        this.canvas.height
    );

    // IMAGE
    if (this.img) {

        this.ctx.drawImage(
            this.img,
            0,
            0
        );
        // this.canvas.style.display = "block";

        // document.getElementById(
        //     "excelPreview"
        // ).innerHTML = "";
    }

    // PDF
    else if (this.pdfPageImage) {

        this.ctx.drawImage(
            this.pdfPageImage,
            0,
            0
        );     
    }

    this.ctx.strokeStyle = "red";

    this.ctx.lineWidth = 4;

    this.ctx.strokeRect(
        this.startX,
        this.startY,
        currX - this.startX,
        currY - this.startY
    );
    this.ctx.fillStyle =
        "rgba(255,0,0,0.15)";

    this.ctx.fillRect(
        this.startX,
        this.startY,
        currX - this.startX,
        currY - this.startY
    );
}, 
async endRect(e) {

    if (!this.isDrawing) return;

    this.isDrawing = false;

    const rect =
        this.canvas.getBoundingClientRect();

    const endX =
        (e.clientX - rect.left) *
        (this.canvas.width / rect.width);

    const endY =
        (e.clientY - rect.top) *
        (this.canvas.height / rect.height);

    if (this.extractMode) {

        await this.extractSingle(
            this.startX,
            this.startY,
            endX,
            endY,
            e
        );

        this.extractMode = false;

    } else {

        await this.extractTable(
            this.startX,
            this.startY,
            endX,
            endY
        );
    }
},
activateExtractMode() {

    this.extractMode = true;

    console.log("Extract mode ON");
}
}