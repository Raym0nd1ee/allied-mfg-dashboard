const API_BASE = "http://127.0.0.1:5000";

window.apiMethods = {

// =====================================================
// GENERIC API HELPER
// =====================================================
async apiFetch(url, options = {}) {

    const res = await fetch(url, options);

    if (!res.ok) {

        const text = await res.text();

        console.error(text);

        throw new Error(text || "Server Error");
    }

    return res.json();
},

// =====================================================
// SALES ORDER FUNCTIONS
// =====================================================
async loadSO() {

    if (!this.so) {
        alert("Enter SO");
        return;
    }

    try {

        const data = await this.apiFetch(
            `${API_BASE}/load_so/${this.so}`
        );

        this.po = data.po;
        this.rows = data.parts;

        this.autoSizeColumns();
        this.resizeAllTextareas();

    } catch (err) {

        console.error(err);
        alert("Failed to load SO");
    }
},

async save() {

    if (this.isLoading) return;

    try {

        const data = await this.apiFetch(
            `${API_BASE}/save`,
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

        console.log(data);

        alert("Saved");

    } catch (err) {

        console.error(err);

        alert("Save failed");
    }
},

// =====================================================
// OCR FUNCTIONS
// =====================================================
async extractTable(x1, y1, x2, y2) {

    if (this.isLoading) return;

    this.isLoading = true;

    try {

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

        formData.append("x", Math.min(x1, x2));
        formData.append("y", Math.min(y1, y2));
        formData.append("w", Math.abs(x2 - x1));
        formData.append("h", Math.abs(y2 - y1));

        const data = await this.apiFetch(
            `${API_BASE}/extract_region`,
            {
                method: "POST",
                body: formData
            }
        );

        this.rows = [
            ...this.rows,
            ...data.parts
        ];

        this.autoSizeColumns();
        this.resizeAllTextareas();

    } catch (err) {

        console.error(err);

        alert("OCR failed");

    } finally {

        this.isLoading = false;
    }
},

async extractSingle(x1, y1, x2, y2, e) {

    if (this.isLoading) return;

    this.isLoading = true;

    try {

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

        formData.append("x", Math.min(x1, x2));
        formData.append("y", Math.min(y1, y2));
        formData.append("w", Math.abs(x2 - x1));
        formData.append("h", Math.abs(y2 - y1));

        const data = await this.apiFetch(
            `${API_BASE}/extract_text`,
            {
                method: "POST",
                body: formData
            }
        );

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

        console.error(err);

    } finally {

        this.isLoading = false;
    }
},

// =====================================================
// DIMENSION FILE FUNCTIONS
// =====================================================
async savePathsJson(paths) {

    try {

        return await this.apiFetch(
            `${API_BASE}/save_paths_json`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    paths
                })
            }
        );

    } catch (err) {

        console.error(err);

        alert("Failed to save paths");

        throw err;
    }
},

async checkMissingParts(skus) {

    try {

        return await this.apiFetch(
            `${API_BASE}/check_missing_parts`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    skus
                })
            }
        );

    } catch (err) {

        console.error(err);

        alert("Missing parts check failed");

        throw err;
    }
},

async importDimensionFiles(records) {

    try {

        return await this.apiFetch(
            `${API_BASE}/import_dimension_files`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    records
                })
            }
        );

    } catch (err) {

        console.error(err);

        alert("Import failed");

        throw err;
    }
},

async getExcelTemplate(sku) {

    try {

        const res = await fetch(
            `${API_BASE}/get_excel_template`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    SKU: sku
                })
            }
        );

        if (!res.ok) {

            throw new Error(
                await res.text()
            );
        }

        return await res.blob();

    } catch (err) {

        console.error(err);

        alert("Template download failed");

        throw err;
    }
},

async downloadDimensionFile(filePath) {

    window.open(
        `${API_BASE}/download_dimension_file?path=${encodeURIComponent(filePath)}`,
        "_blank"
    );
}


};
