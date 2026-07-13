window.apiMethods = {
    async loadSO() {

        if (!this.so) {

            alert("Enter SO");
            return;
        }

        try {

            const res = await fetch(
                `http://127.0.0.1:5000/load_so/${this.so}`
            );

            const data = await res.json();

            this.po = data.po;
            this.rows = data.parts;

            this.autoSizeColumns();

            this.resizeAllTextareas();

        } catch (err) {

            console.log(err);
        }
    },

    async save() {

        if (this.isLoading) return;
        try {

            const res = await fetch(
                "http://127.0.0.1:5000/save",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify({
                        so: this.so,
                        po: this.po,
                        parts: this.rows
                    })
                }
            );

            if (!res.ok) {

                const text = await res.text();

                console.log(text);

                throw new Error("Server error");
            }

            if (!res.ok) {

                const text = await res.text();

                console.log(text);

                throw new Error("Server error");
            }

            let data = await res.json();

            console.log(data);

            alert("Saved");

        } catch (err) {

            console.log(err);

            alert("Save failed");
        }
    },

    async extractTable(x1, y1, x2, y2) {

        if (this.isLoading) return;
        this.isLoading = true;

        let formData = new FormData();

        if (this.currentFile.name.toLowerCase().endsWith(".pdf")) {

            formData.append(
                "file",
                this.pdfImageBlob,
                "pdf_page.png"
            );

        } else {

            formData.append(
                "file",
                this.currentFile
            );
        }

        formData.append(
            "x",
            Math.min(x1, x2)
        );

        formData.append(
            "y",
            Math.min(y1, y2)
        );

        formData.append(
            "w",
            Math.abs(x2 - x1)
        );

        formData.append(
            "h",
            Math.abs(y2 - y1)
        );

        try {

            let res = await fetch(
                "http://127.0.0.1:5000/extract_region",
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!res.ok) {

                const text = await res.text();

                console.log(text);

                throw new Error("Server error");
            }

            if (!res.ok) {

                const text = await res.text();

                console.log(text);

                throw new Error("Server error");
            }

            let data = await res.json();

            this.rows = [
                ...this.rows,
                ...data.parts
            ];

            this.autoSizeColumns();

            this.resizeAllTextareas();

        } catch (err) {

            console.log(err);

            alert("OCR failed");

        } finally {

            this.isLoading = false;
        }
    },
    async extractSingle(x1, y1, x2, y2, e) {

        if (this.isLoading) return;
        this.isLoading = true;

        let formData = new FormData();

        if (this.currentFile.name.toLowerCase().endsWith(".pdf")) {

            formData.append(
                "file",
                this.pdfImageBlob,
                "pdf_page.png"
            );

        } else {

            formData.append(
                "file",
                this.currentFile
            );
        }

        formData.append(
            "x",
            Math.min(x1, x2)
        );

        formData.append(
            "y",
            Math.min(y1, y2)
        );

        formData.append(
            "w",
            Math.abs(x2 - x1)
        );

        formData.append(
            "h",
            Math.abs(y2 - y1)
        );

        try {

            let res = await fetch(
                "http://127.0.0.1:5000/extract_text",
                {
                    method: "POST",
                    body: formData
                }
            );

            if (!res.ok) {

                const text = await res.text();

                console.log(text);

                throw new Error("Server error");
            }

            let data = await res.json();

            const text =
                (data.text || "").toUpperCase();

            this.ocrTokens.push({

                id: Date.now(),

                text,

                type: "generic",

                x: e.clientX,

                y: e.clientY
            });

            if (this.ocrTokens.length > 20) {

                this.ocrTokens.shift();
            }

        } catch (err) {

            console.log(err);

        } finally {

            this.isLoading = false;
        }
    }    
}
