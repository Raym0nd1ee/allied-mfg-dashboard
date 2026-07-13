ocrMethods = {
    getTokenColor(type) {

        switch (type) {

            case "qty":
                return "#4CAF50"; // green

            case "po":
                return "#2196F3"; // blue

            case "so":
                return "#FF9800"; // orange

            default:
                return "#FFEB3B"; // yellow
        }
    }

}