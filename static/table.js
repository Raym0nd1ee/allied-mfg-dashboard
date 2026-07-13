tableMethods = {
    addRow() {
        this.rows.push({ part_no: "", description: "", qty: "" });
    },   

    removeRow(index) {
        if (confirm("Delete this row?")) {
            this.rows.splice(index, 1);
        }
    },
    autoResizeTextarea(el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    },
    resizeAllTextareas() {

        this.$nextTick(() => {

            const areas =
                document.querySelectorAll("textarea");

            areas.forEach(el => {

                el.style.height = "auto";

                el.style.height =
                    el.scrollHeight + "px";
            });
        });
    },
    autoResizeTextarea(el) {
        el.style.height = "auto";
        el.style.height = el.scrollHeight + "px";
    },
    autoSizeColumns() {
        const minWidths = [80, 120, 50];
        const maxWidths = [200, 400, 100];

        const cols = ["part_no", "description", "qty"];

        let newWidths = [...minWidths];

        this.rows.forEach(row => {
            cols.forEach((col, i) => {
                const text = (row[col] || "").toString().toUpperCase();

                // Estimate width (rough: 8px per char)
                // const estimated = text.length * 8 + 20;
                const estimated = this.getTextWidth(text) + 20;

                if (estimated > newWidths[i]) {
                    newWidths[i] = Math.min(estimated, maxWidths[i]);
                }
            });
        });

        this.colWidths = newWidths;
    },
    handleKey(e, row, col) {
        const totalCols = 3;

        let newRow = row;
        let newCol = col;

        switch (e.key) {
            case "Enter":
                e.preventDefault();
                newRow++;
                break;

            case "ArrowRight":
            case "Tab":
                if (e.key === "Tab") e.preventDefault();
                newCol++;
                if (newCol >= totalCols) {
                    newCol = 0;
                    newRow++;
                }
                break;

            case "ArrowLeft":
                newCol--;
                if (newCol < 0) {
                    newCol = totalCols - 1;
                    newRow--;
                }
                break;

            case "ArrowDown":
                newRow++;
                break;

            case "ArrowUp":
                newRow--;
                break;

            default:
                return;
        }

        // Auto add row if moving beyond last row
        if (newRow >= this.rows.length) {
            this.addRow();
        }

        if (newRow < 0) newRow = 0;

        this.$nextTick(() => {
            const refName = `cell-${newRow}-${newCol}`;
            const el = this.$refs[refName];

            // Vue 3 returns array for v-for refs
            if (el && el[0]) {
                el[0].focus();
                el[0].select();
            }
        });
    },
    startResize(e, colIndex) {
        this.resizingCol = colIndex;
        this.startX = e.clientX;
        this.startWidth = this.colWidths[colIndex];

        document.addEventListener("mousemove", this.resizeColumn);
        document.addEventListener("mouseup", this.stopResize);
    },
    resizeColumn(e) {
        if (this.resizingCol === null) return;

        const diff = e.clientX - this.startX;
        const newWidth = this.startWidth + diff;

        if (newWidth > 40) { // minimum width
            this.colWidths[this.resizingCol] = newWidth;
        }
    },
    stopResize() {
        document.removeEventListener("mousemove", this.resizeColumn);
        document.removeEventListener("mouseup", this.stopResize);
        this.resizingCol = null;
    },
    getTextWidth(text) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        ctx.font = "14px sans-serif";
        return ctx.measureText(text).width;
    }
}