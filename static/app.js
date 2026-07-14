const { createApp } = Vue;

createApp({

    data() {
        return {
            // ADD THIS SINGLE LINE:
            showPathsSection: false,
            selectedDimensionFile: null,
            selectedFileBuffer: null, // <-- ADD THIS LINE
            so: "",
            po: "",
            rows: [],
            isLoading: false,
            currentFile: null,
            startX: 0,
            startY: 0,
            isDrawing: false,
            canvas: null,
            ctx: null,
            img: null,
            colWidths: [100, 150, 60],
            resizingCol: null,
            startWidth: 0,
            rightMode: false,
            extractMode: false,
            ocrTokens: [],
            clipboard: [],
            activeClipboard: "",
            pdfPageImage: null,
            qcDimensions: [],
            excelData: [],
            rawExcelData: [],
            pdfImageBlob: null,
            searchPartNo: "",
            csvData: [],
            so: "",
            po: "",
            partNo: "",
            partName: "",
            rev: "",
            qtyOrder: "",
            selectedCsvIndex: null,
            currentFile: null,
            selectedDimensionFiles: [],
            workbook: null,
            selectedCsvIndices: [],
            originalCsvData: [],  // Add this to store your permanent backup list
            soSearchQuery: '',    // Add this to bind to the text box string

        }
    },

    methods: {
        async loadPathsExcel(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array" });

                    const sheetName = workbook.SheetNames[0];
                    const sheet = workbook.Sheets[sheetName];

                    // 1. Convert Excel sheet data directly into clean JSON row entries natively
                    const jsonData = XLSX.utils.sheet_to_json(sheet);
                    console.log("Raw Uploaded Path Rows Data Matrix:", jsonData);

                    const records = [];

                    // 2. Map and parse values safely for your server and frontend tracking states
                    const structuredPaths = jsonData.map(excelRow => {
                        const rawFileName = String(excelRow["File Name"] || "").trim();
                        const rawFilePath = String(excelRow["File Path"] || "").trim();

                        // 🟢 EXTRACT CUSTOMER NAME METADATA FROM THE DYNAMIC CELL KEY HEADERS
                        const rawCustomerName = String(excelRow["Customer Name"] || excelRow["Customer"] || "").trim();

                        // Build copy of data matching exactly your master frontend view data rows structures
                        const vueRowRecord = {
                            // Pull standard columns mapping them to the UI data keys
                            "SO": excelRow["SO"] || "",
                            "PO": excelRow["PO"] || "",
                            "SKU": excelRow["SKU"] || excelRow["PART NUMBER"] || "",
                            "PART_NAME": excelRow["PART_NAME"] || excelRow["PART NAME"] || "",
                            "qtyOrder": excelRow["qtyOrder"] || excelRow["QTY"] || 0,
                            "REV": excelRow["REV"] || "0",

                            // 🟢 SECURELY INJECT CUSTOMER VALUE AS A REAL PROPERTY SO VUE SAVES IT IN MEMORY
                            "Customer Name": rawCustomerName,

                            // Pre-instantiate interactive operational inputs for grid reactivity tracking
                            "inputDate": "",
                            "inputPIC": "",
                            "inputUAI": "",
                            "inputRejectedQty": null,
                            "inputRework": null,
                            "inputRedoNew": null,
                            "inputRemarks": ""
                        };

                        records.push(vueRowRecord);

                        // Normalizer format logic sequence passes
                        const cleanRecord = rawFileName
                            .replace(/\.xlsx|\.xls/i, "")
                            .toLowerCase()
                            .replace(/[\s_\-]+/g, "");

                        return {
                            "File Name": rawFileName.replace(/\.xlsx|\.xls/i, ""),
                            "File Path": rawFilePath,
                            "Customer Name": rawCustomerName,
                            "Clean Extracted Record": cleanRecord
                        };
                    });

                    // 3. Update your frontend Vue data matrix state instantly with all keys present
                    this.csvData = records;
                    this.selectedCsvIndices = [];

                    console.log("SUCCESS! Fresh data keys loaded into memory:", Object.keys(records[0] || {}));
                    console.log("Structured JSON mapping payload ready for Server upload:", structuredPaths);

                    // 4. POST the updated path reference JSON configuration file back to your local Flask app
                    const res = await fetch("http://127.0.0.1:5000/save_paths_json", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ paths: structuredPaths })
                    });

                    const result = await res.json();
                    if (res.ok && result.success) {
                        alert("Master Path Reference and On-Screen Table Rows successfully updated!");
                    } else {
                        alert("Failed to save paths configuration matrix to Flask backend: " + result.error);
                    }
                } catch (err) {
                    console.error("Processing or communication error encountered:", err);
                    alert("Error parsing file or communicating with your local Flask server on port 5000.");
                }
            };
            reader.readAsArrayBuffer(file);
        }
        ,
       // 🟢 PUSH THESE TWO BLOCKS INSIDE YOUR VUE CONTROLLER APP.JS FILE:

toggleSelectAllFilteredRows(event) {
    const isChecked = event.target.checked;

    // 1. Calculate which row index numbers are matching your search bar text string
    const filteredIndices = this.csvData
        .map((row, index) => ({ row, index }))
        .filter(item => {
            if (!this.soSearchQuery) return true;
            
            // Splits commas to support searching multiple sales orders simultaneously
            const queries = this.soSearchQuery.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            return queries.some(q => String(item.row.SO || "").toLowerCase().includes(q));
        })
        .map(item => item.index);

    // 2. Safe calculation loop to merge indices cleanly
    if (isChecked) {
        const newSelectionCollection = new Set([...this.selectedCsvIndices, ...filteredIndices]);
        this.selectedCsvIndices = Array.from(newSelectionCollection);
    } else {
        this.selectedCsvIndices = this.selectedCsvIndices.filter(idx => !filteredIndices.includes(idx));
    }
},

get isAllFilteredSelected() {
    if (!this.csvData || this.csvData.length === 0) return false;
    
    const filteredIndices = this.csvData
        .map((row, index) => ({ row, index }))
        .filter(item => {
            if (!this.soSearchQuery) return true;
            const queries = this.soSearchQuery.split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
            return queries.some(q => String(item.row.SO || "").toLowerCase().includes(q));
        })
        .map(item => item.index);

    if (filteredIndices.length === 0) return false;
    return filteredIndices.every(idx => this.selectedCsvIndices.includes(idx));
},
        ...createQcMethods,
        selectDimensionFiles(e) {

            const files =
                Array.from(e.target.files);

            if (!files.length) return;

            this.selectedDimensionFiles = files;

            console.log(
                "Selected excel files:",
                files
            );
        },
        async handleQCUpload(e) {

            this.currentFile = e.target.files[0];

            if (!this.currentFile) return;

            const fileName =
                this.currentFile.name.toLowerCase();

            // =========================
            // CSV
            // =========================
            if (fileName.endsWith(".csv")) {

                const reader = new FileReader();

                reader.onload = (event) => {

                    const csv =
                        event.target.result;

                    const rows =
                        csv.split("\n")
                            .map(r => r.split(","));

                    // this.rawExcelData = rows;

                    console.log(this.rawExcelData);

                    // Optional preview
                    let html = "<table border='1'>";

                    rows.forEach(row => {

                        html += "<tr>";

                        row.forEach(col => {
                            html += `<td>${col}</td>`;
                        });

                        html += "</tr>";
                    });

                    html += "</table>";

                    document.getElementById(
                        "excelPreview"
                    ).innerHTML = html;
                };

                reader.readAsText(this.currentFile);
            }

            // =========================
            // EXCEL
            // =========================
            else if (
                fileName.endsWith(".xlsx") ||
                fileName.endsWith(".xls")
            ) {

                const reader = new FileReader();

                reader.onload = (event) => {

                    const data = new Uint8Array(
                        event.target.result
                    );

                    const workbook = XLSX.read(data, {
                        type: "array"
                    });

                    const sheet =
                        workbook.Sheets[
                        workbook.SheetNames[0]
                        ];

                    // this.rawExcelData =
                    //     XLSX.utils.sheet_to_json(sheet, {
                    //         header: 1
                    //     });

                    const html =
                        XLSX.utils.sheet_to_html(sheet);

                    document.getElementById(
                        "excelPreview"
                    ).innerHTML = html;
                };

                reader.readAsArrayBuffer(
                    this.currentFile
                );
            }
        },

        async loadExcelTemplate(event) {

            const file = event.target.files[0];

            if (!file) return;

            // IMPORTANT
            this.currentFile = file;

            console.log("Excel selected:", file);

            const data = await file.arrayBuffer();

            const workbook = XLSX.read(data, {
                type: "array"
            });

            const sheetName =
                workbook.SheetNames[0];

            const sheet =
                workbook.Sheets[sheetName];

            // IMPORTANT
            // this.rawExcelData =
            //     XLSX.utils.sheet_to_json(sheet, {
            //         header: 1
            //     });

            // preview
            const html =
                XLSX.utils.sheet_to_html(sheet);

            // document.getElementById(
            //     "excelPreview"
            // ).innerHTML = html;

            console.log(this.rawExcelData);
        },

        // Add this helper method inside your Vue methods configuration blocks
async loadCsvFromSynology() {
    this.isLoading = true;
    // Piped securely across the open ngrok internet tunnel gateway
    const targetUrl = "https://ngrok-free.dev";

    try {
        const res = await fetch(targetUrl);
        const data = await res.json();

        if (res.ok && data.success) {
            // Re-uses your existing CSV file parser workflow layout on the raw string
            this.processCsvStringData(data.rawData); 
            alert("Successfully loaded CSV directly from Synology NAS!");
        } else {
            alert("Error: " + data.error);
        }
    } catch (err) {
        console.error("Synology bridge failure:", err);
        alert("Failed to reach your office Synology directory path.");
    } finally {
        this.isLoading = false;
    }
},
        async loadCSV(e) {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (event) => {
                const data = new Uint8Array(event.target.result);

                // XLSX can parse CSV correctly
                const workbook = XLSX.read(data, { type: "array" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(sheet);

                console.log("CSV Data:", jsonData);

                // Correct mapping
                this.csvData = jsonData.map(r => {
                    const skuStr = r["SKU"] ? String(r["SKU"]).trim() : "";

                    return {
                        SO: r["SalesOrder Number"],
                        PO: r["Reference#"] ? String(r["Reference#"]).replace(/^[^0-9]+/, "") : "",
                        SKU: r["SKU"],
                        PART_NAME: r["Item Name"],
                        qtyOrder: r["QuantityOrdered"],
                        customerName: r["Customer Name"] || r["Customer"] || "",

                        // Directly strips everything up to "REV" and keeps only the revision value
                        REV: skuStr.toLowerCase().includes("rev")
                            ? skuStr.replace(/^.*rev-?\s*/i, "")
                            : ""
                    };
                });

                // ========================================================
                // SUCCESS: Save the master backup array right here!
                // ========================================================
                this.originalCsvData = [...this.csvData];

                console.log("Original Backup Saved:", this.originalCsvData);
            };

            reader.readAsArrayBuffer(file);
        },
        extractRev(sku) {
            if (!sku) return "";
            // Basic logic: takes the last part after a hyphen
            const parts = sku.split('-');
            return parts.length > 1 ? parts.pop() : "";
        },
        addQCDimension() {

            this.qcDimensions = [];

            this.rawExcelData.slice(9).forEach((row) => {

                if (!row) return;

                // skip footer rows
                const firstCell = String(row[0] || "").toUpperCase();

                if (
                    firstCell.includes("INSPECTED") ||
                    firstCell.includes("REMARKS")
                ) {
                    return;
                }

                // skip empty rows
                if (
                    !row[0] &&
                    !row[2]
                ) {
                    return;
                }

                this.qcDimensions.push({

                    NO: row[0] || "",

                    SPEC: row[1] || "",

                    TOLERANCE: row[2] || "",

                    LSL: row[3] || "",

                    USL: row[4] || "",

                    INSTR_USED: row[5] || "",

                    U1: row[6] || "",
                    A1: row[7] || "",
                    O1: row[8] || "",

                    U2: row[9] || "",
                    A2: row[10] || "",
                    O2: row[11] || "",

                    U3: row[12] || "",
                    A3: row[13] || "",
                    O3: row[14] || "",

                    U4: row[15] || "",
                    A4: row[16] || "",
                    O4: row[17] || "",

                    U5: row[18] || "",
                    A5: row[19] || "",
                    O5: row[20] || "",

                    REMARK: row[21] || ""
                });

            });

            console.log(this.qcDimensions);
        },

        applySOFilter() {
            const query = this.soSearchQuery.trim().toLowerCase();

            if (!query) {
                alert("Please enter an SO number to filter.");
                return;
            }

            // Reset any checkbox selections before filtering to prevent index errors
            this.selectedCsvIndices = [];

            // FIXED: Changed str() to JavaScript String()
            this.csvData = this.originalCsvData.filter(row => {
                const rowSO = String(row.SO || '').trim().toLowerCase();
                return rowSO.includes(query);
            });

            if (this.csvData.length === 0) {
                alert(`No records found matching SO: ${this.soSearchQuery}`);
            }
        },

        clearSOFilter() {
            this.soSearchQuery = '';
            this.selectedCsvIndices = [];
            // Restore your original dataset seamlessly
            this.csvData = [...this.originalCsvData];
        },


        // 2. Update your method within methods:
        async importSelectedCSVToExcel() {
            if (!this.selectedCsvIndices || this.selectedCsvIndices.length === 0) {
                alert("Please select at least one row checkbox first.");
                return;
            }

            // Map checked row indices into a dataset payload array
            const selectedRowsData = this.selectedCsvIndices.map(index => this.csvData[index]);
            this.isLoading = true;

            // THE FULL CORRECT TARGET URL (Pointing directly to your updated Python Flask JSON lookup route)
            // const targetUrl = "http://127.0.0.1:5000/import_dimension_files";
             const targetUrl = "https://ngrok-free.dev";
            console.log("Routing payload data straight to Python endpoint:", targetUrl);

            try {
                // 🟢 FIXED: Add the explicit ngrok bypass header into your network fetch payload
const res = await fetch(targetUrl, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        "ngrok-skip-browser-warning": "true" // 👈 ADD THIS EXACT LINE HERE
    },
    body: JSON.stringify({ records: selectedRowsData })
});

                const data = await res.json();

                if (res.ok && data.success)
                    // {alert(`Process complete!\nUpdated: ${data.updated || 0} files.\nFailed: ${data.failed ? data.failed.length : 0} files.`);
                    //     this.selectedCsvIndices = []; } 
                    // 🟢 NEW CORRECT LINE:
                    if (res.ok && data.success) {
                        alert(`Process complete!\nUpdated: ${data.updated ? data.updated.length : 0} files.\nFailed: ${data.failed ? data.failed.length : 0} files.`);
                        this.selectedCsvIndices = []; // Reset checkboxes layout cleanly
                    }
                    else {
                        alert("Backend processing error: " + data.error);
                    }
            } catch (err) {
                console.error("Batch routing network error details:", err);
                alert("Failed to communicate with your local Flask backend on port 5000.");
            } finally {
                this.isLoading = false;
            }
        }
        ,

        async exportQCJson() {

            const qcData = {

                partName: this.partName,

                so: this.so,

                po: this.po,

                parts: this.rows,

                dimensions: this.qcDimensions
            };

            try {

                const res = await fetch(
                    "http://127.0.0.1:5000/save_qc_json",
                    {
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify(qcData)
                    }
                );

                const data = await res.json();

                console.log(data);

                alert("QC JSON Saved");

            } catch (err) {

                console.log(err);

                alert("Save JSON failed");
            }
        },
        removeQCDimension(index) {

            this.qcDimensions.splice(index, 1);
        },

        myFunction() {
            console.log("click")
            var x = document.getElementById("viewer");
            if (x.style.display === "none") {
                x.style.display = "block";
            } else {
                x.style.display = "none";
            }
        },

        // async saveUpdatedWorkbook(workbook) {
        //     if (!this.selectedDimensionFile) {
        //         alert("No Excel file selected");
        //         return;
        //     }

        //     // 1. Get the name of the 1st sheet using index [0] -> "Sheet0"
        //     const firstSheetName = workbook.SheetNames[0]; 

        //     // 2. Target only Sheet0
        //     const firstSheet = workbook.Sheets[firstSheetName];

        //     if (!firstSheet) {
        //         alert("The first sheet could not be found.");
        //         return;
        //     }

        //     // 3. Insert values ONLY into the first sheet (Sheet0)
        //     // Example: This adds "New Value" to cell A1 without touching the "Sheet" tab
        //     XLSX.utils.sheet_add_aoa(firstSheet, [["New Value"]], { origin: "A1" });

        //     // 4. Set the original filename structure
        //     const originalName = this.selectedDimensionFile.name;
        //     const newFileName = originalName.replace(/\.xlsx|\.xls/i, "_UPDATED.xlsx");

        //     // 5. Save the workbook (The 2nd sheet "Sheet" remains completely unchanged)
        //     XLSX.writeFile(workbook, newFileName);

        //     console.log("Only Sheet0 was updated. Workbook saved.");
        // }
        // async saveUpdatedWorkbook(workbook) {
        //     if (!this.selectedDimensionFile) {
        //         alert("No Excel file selected");
        //         return;
        //     }

        //     // 1. Get the name of the 1st sheet using index [0] -> "Sheet0"
        //     const firstSheetName = workbook.SheetNames[0]; 

        //     // 2. Target only Sheet0
        //     const firstSheet = workbook.Sheets[firstSheetName];

        //     if (!firstSheet) {
        //         alert("The first sheet could not be found.");
        //         return;
        //     }

        //     // 3. IN-PLACE CELL UPDATE (Preserves styles, column widths, and layouts)
        //     const targetCell = "A1";
        //     const newValue = "New Value";

        //     if (firstSheet[targetCell]) {
        //         // Cell exists: update value and type to keep existing styling
        //         firstSheet[targetCell].v = newValue;
        //         firstSheet[targetCell].t = typeof newValue === "number" ? "n" : "s";

        //         // Delete formatting cache so Excel updates the displayed text
        //         delete firstSheet[targetCell].w; 
        //     } else {
        //         // Cell is empty: construct a basic cell structure
        //         firstSheet[targetCell] = { 
        //             v: newValue, 
        //             t: typeof newValue === "number" ? "n" : "s" 
        //         };
        //     }

        //     // 4. Set the original filename structure
        //     const originalName = this.selectedDimensionFile.name;
        //     const newFileName = originalName.replace(/\.xlsx|\.xls/i, "_UPDATED.xlsx");

        //     // 5. Save the workbook (The 2nd sheet "Sheet" remains completely unchanged)
        //     XLSX.writeFile(workbook, newFileName);

        //     console.log("Only Sheet0 was updated in-place. Layout preserved. Workbook saved.");
        // }
        async saveUpdatedWorkbook() {
            // 1. Ensure the pre-read file data exists
            if (!this.selectedFileBuffer) {
                alert("No Excel file data available. Please re-select your file.");
                return;
            }

            const ExcelJSInstance = window.ExcelJS || window.exceljs;
            if (!ExcelJSInstance) {
                alert("CRITICAL ERROR: 'exceljs.min.js' file is missing from your static folder.");
                return;
            }

            try {
                console.log("Loading secured file buffer into ExcelJS...");
                const workbook = new ExcelJSInstance.Workbook();

                // Load using the memory buffer directly to completely avoid NotReadableError
                await workbook.xlsx.load(this.selectedFileBuffer);

                // 2. Select target sheet
                const sheet0 = workbook.getWorksheet("sheet0") ||
                    workbook.getWorksheet("Sheet0") ||
                    workbook.worksheets[0];

                if (!sheet0) {
                    alert("Worksheet 'sheet0' could not be found inside this template.");
                    return;
                }

                // 3. MAP YOUR ACTUAL DATA FROM THE PROXY OBJECT
                // Based on your logged data payload:
                // { SO: 'SO260001', PO: 2100115598, SKU: 'Z3000-HF231 REV 0', ... }

                // Replace these coordinates with the exact cells matching your layout
                sheet0.getCell("B2").value = this.currentRecord?.SO || "";
                sheet0.getCell("B3").value = this.currentRecord?.PO || "";
                sheet0.getCell("B4").value = this.currentRecord?.SKU || "";
                sheet0.getCell("B5").value = this.currentRecord?.PART_NAME || "";
                sheet0.getCell("B6").value = this.currentRecord?.qtyOrder || "";

                // 4. Package layout and stream for download
                const updatedBuffer = await workbook.xlsx.writeBuffer();

                // 5. Output filename generation logic
                const originalName = this.selectedDimensionFile.name;
                const newFileName = originalName.replace(/\.xlsx|\.xls/i, "_UPDATED.xlsx");

                // 6. Execute direct browser download
                const blob = new Blob([updatedBuffer], {
                    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                });

                const link = document.createElement("a");
                link.href = URL.createObjectURL(blob);
                link.download = newFileName;
                link.style.display = 'none';
                document.body.appendChild(link);

                link.click();

                document.body.removeChild(link);
                URL.revokeObjectURL(link.href);
                console.log("Workbook saved perfectly with all styling elements and logos intact.");

            } catch (error) {
                console.error("Internal processing stream exception:", error);
                alert("Processing failed. Please check the developer console log.");
            }
        }
        ,
        // ============================================================================
        // UNIFIED PROPERTY-TARGETED EXTRACTION ENGINE (100% RELIABLE)
        // ============================================================================
        async exportToRejectionFormEngine() {
            console.log("%c [ENGINE ACTIVE] -> Initiating secure cell parsing sequence...", "background: #198754; color: #fff; font-weight: bold; font-size: 13px; padding: 3px;");

            try {
                // 1. Locate the live checkbox elements currently checked on your screen dashboard
                const rowCheckboxes = document.querySelectorAll('.table tbody tr input[type="checkbox"]');
                let targetRowElement = null;
                let targetRowVueIndex = null;

                for (let i = 0; i < rowCheckboxes.length; i++) {
                    if (rowCheckboxes[i].checked) {
                        targetRowElement = rowCheckboxes[i].closest('tr');
                        targetRowVueIndex = parseInt(rowCheckboxes[i].value, 10);
                        break; // Grab the primary checked data row card configuration block
                    }
                }

                if (!targetRowElement || targetRowVueIndex === null || isNaN(targetRowVueIndex)) {
                    alert('Please check at least one row checkbox configuration block from the matrix before exporting.');
                    return;
                }

                // 2. Query your active Vue data array structures via "this" context references
                const masterRows = this.csvData || [];
                const activeDataRow = masterRows[targetRowVueIndex];

                if (!activeDataRow) {
                    alert('Could not find active database data variables at index row pointer: ' + targetRowVueIndex);
                    return;
                }

                // ============================================================================
                // 🟢 THE FIX: ACCURATE INTERACTION EXTRACTION VIA SPECIFIC DOM SELECTORS
                // ============================================================================

                // A. Safely resolve Customer Name properties across all file header versions
                let extractedCustomer = activeDataRow['Customer Name'] ||
                    activeDataRow['customerName'] ||
                    activeDataRow['Customer_Name'] ||
                    activeDataRow['Customer'] ||
                    window.lastUploadedCustomerName || '';

                // B. Target inputs accurately using explicit structural attributes 
                const liveDate = targetRowElement.querySelector('input[type="date"]')?.value || '';

                // Track input elements directly using their respective v-model variables or text types safely
                const allTextInputElements = targetRowElement.querySelectorAll('input[type="text"]');
                const allNumInputElements = targetRowElement.querySelectorAll('input[type="number"]');

                // Read custom operational fields accurately regardless of column index shuffling
                let livePIC = '', liveUAI = '', liveRemarks = '';
                allTextInputElements.forEach(inputNode => {
                    const modelExpression = inputNode.getAttribute('v-model') || '';
                    const innerHTMLString = inputNode.outerHTML || '';

                    if (modelExpression.includes('inputPIC') || innerHTMLString.includes('inputPIC') || innerHTMLString.includes('PIC')) {
                        livePIC = inputNode.value;
                    } else if (modelExpression.includes('inputUAI') || innerHTMLString.includes('inputUAI') || innerHTMLString.includes('UAI')) {
                        liveUAI = inputNode.value;
                    } else if (modelExpression.includes('inputRemarks') || innerHTMLString.includes('inputRemarks') || innerHTMLString.includes('Remarks')) {
                        liveRemarks = inputNode.value;
                    }
                });

                // Fallback: If advanced attribute tracking yielded empty text, use safe defaults
                if (!livePIC && allTextInputElements[0]) livePIC = allTextInputElements[0].value || '';
                if (!liveUAI && allTextInputElements[1]) liveUAI = allTextInputElements[1].value || '';
                if (!liveRemarks && allTextInputElements[allTextInputElements.length - 1]) {
                    liveRemarks = allTextInputElements[allTextInputElements.length - 1].value || '';
                }

                let liveRejected = '0', liveRework = '0', liveRedo = '0';
                allNumInputElements.forEach(numNode => {
                    const modelExpression = numNode.getAttribute('v-model') || '';
                    const innerHTMLString = numNode.outerHTML || '';

                    if (modelExpression.includes('RejectedQty') || innerHTMLString.includes('Rejected') || innerHTMLString.includes('reject')) {
                        liveRejected = numNode.value;
                    } else if (modelExpression.includes('Rework') || innerHTMLString.includes('Rework') || innerHTMLString.includes('rework')) {
                        liveRework = numNode.value;
                    } else if (modelExpression.includes('RedoNew') || innerHTMLString.includes('Redo') || innerHTMLString.includes('redo')) {
                        liveRedo = numNode.value;
                    }
                });

                // Fallback for numeric metrics parameters
                if (liveRejected === '0' && allNumInputElements[0]) liveRejected = allNumInputElements[0].value || '0';
                if (liveRework === '0' && allNumInputElements[1]) liveRework = allNumInputElements[1].value || '0';
                if (liveRedo === '0' && allNumInputElements[2]) liveRedo = allNumInputElements[2].value || '0';

                // Core table string variables passthroughs
                let skuString = activeDataRow.SKU ? String(activeDataRow.SKU).trim() : '';
                let textSO = activeDataRow.SO ? String(activeDataRow.SO).trim() : '';

                const qtyVal = parseFloat(activeDataRow.qtyOrder) || 0;
                const rejectVal = parseFloat(liveRejected) || 0;
                const reworkVal = parseFloat(liveRework) || 0;
                const redoVal = parseFloat(liveRedo) || 0;

                // Process Sales Order codes formatting rules
                let cleanSOText = textSO.replace(/^SO/i, '');
                let processedSO = /^\d+$/.test(cleanSOText) ? parseInt(cleanSOText, 10) : cleanSOText;

                // Final execution logs dump for precise operator tracking
                console.log("=== VERIFIED EXPORT METRICS PIPELINE ===");
                console.log({
                    "Target Excel Cell F3 (Customer)": extractedCustomer,
                    "Target Excel Cell C3 (SO#)": processedSO,
                    "Target Excel Cell F4 (SKU)": skuString,
                    "Target Excel Cell C2 (Date)": liveDate,
                    "Target Excel Cell C4 (PIC)": livePIC,
                    "Target Excel Cell H2 (UAI Approved By)": liveUAI,
                    "Target Excel Cell H4 (Rejected Qty)": rejectVal,
                    "Target Excel Cell J3 (Rework)": reworkVal,
                    "Target Excel Cell J4 (Redo New)": redoVal,
                    "Target Excel Cell C5 (Remarks)": liveRemarks
                });

                // 3. Programmatically launch file picker pop-up frame natively
                const fileSelector = document.createElement('input');
                fileSelector.type = 'file';
                fileSelector.accept = '.xlsx, .xls';

                fileSelector.onchange = async (e) => {
                    try {
                        if (!e.target.files || e.target.files.length === 0) return;
                        const chosenFile = e.target.files[0];

                        const ExcelJSInstance = window.ExcelJS || window.exceljs;
                        const workbook = new ExcelJSInstance.Workbook();
                        const arrayBuffer = await chosenFile.arrayBuffer();
                        await workbook.xlsx.load(arrayBuffer);

                        const tabCollection = [];
                        workbook.eachSheet(sheet => tabCollection.push(sheet.name));
                        const activeDefault = tabCollection.includes('JAN') ? 'JAN' : tabCollection[0];

                        const selectedTab = prompt(`Enter worksheet tab name to use:\nOptions: ${tabCollection.join(', ')}`, activeDefault);
                        if (!selectedTab) return;

                        const worksheet = workbook.getWorksheet(selectedTab);
                        if (!worksheet) {
                            alert(`Worksheet named "${selectedTab}" could not be reached.`);
                            return;
                        }

                        // ================================================================
                        // PRECISE DATA INJECTION MATRIX (STYLING PRESERVED & UPPERCASE)
                        // ================================================================

                        worksheet.getCell('F1').value = "Byju";
                        // ROW 2 INJECTIONS
                        if (liveDate) {
                            const dParts = liveDate.split('-'); // Format: "YYYY-MM-DD"
                            worksheet.getCell('C2').value = new Date(parseInt(dParts[0], 10), parseInt(dParts[1], 10) - 1, parseInt(dParts[2], 10));
                        } else {
                            worksheet.getCell('C2').value = '';
                        }
                        worksheet.getCell('H2').value = liveUAI ? String(liveUAI).toUpperCase() : '';
                        // ROW 3 INJECTIONS
                        worksheet.getCell('C3').value = processedSO ? String(processedSO).toUpperCase() : '';
                        // 🟢 FIXED AT TARGET CELL F3: Injects the valid uppercase customer name string seamlessly
                        worksheet.getCell('F3').value = extractedCustomer ? String(extractedCustomer).toUpperCase() : '';
                        worksheet.getCell('H3').value = qtyVal;
                        worksheet.getCell('J3').value = reworkVal;
                        // ROW 4 INJECTIONS
                        worksheet.getCell('C4').value = livePIC ? String(livePIC).toUpperCase() : '';
                        worksheet.getCell('F4').value = skuString ? String(skuString).toUpperCase() : ''; // Preserves full SKU and REV text intact
                        worksheet.getCell('H4').value = rejectVal;
                        worksheet.getCell('J4').value = redoVal;
                        // ROW 5 INJECTIONS
                        worksheet.getCell('C5').value = liveRemarks ? String(liveRemarks).toUpperCase() : '';
                        // Write standard formula assignment without deleting surrounding cell visual styles
                        worksheet.getCell('H1').value = { formula: 'H4/H3' };
                        console.log("Generating modified spreadsheet byte streams block...");
                        const outputBuffer = await workbook.xlsx.writeBuffer();
                        const outputBlob = new Blob([outputBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
                        const downloadLink = document.createElement('a');
                        downloadLink.href = URL.createObjectURL(outputBlob);
                        downloadLink.download = 'IPQC_REJECTION_FORM_OUTPUT.xlsx';
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
                        console.log("%c [SUCCESS] -> Spreadsheet injected and delivered!", "color: #198754; font-weight: bold;");
                    } catch (innerErr) {
                        console.error("EXCEL GENERATION REWRITE CRASHED:", innerErr);
                        alert('Excel File Generation Error: ' + innerErr.message);
                    }
                };
                fileSelector.click();
            } catch (err) {
                console.error("PIPELINE ENCOUNTERED EXCEPTION CRASH:", err);
                alert('Data output translation engine failed: ' + err.message);
            }
        }


        ,
        ...window.apiMethods,
        ...window.canvasMethods,
        ...window.tableMethods,
        ...window.dragDropMethods,
        ...window.ocrMethods,
    },

    mounted() {

        console.log("Vue mounted");
    }

}).mount("#app");
