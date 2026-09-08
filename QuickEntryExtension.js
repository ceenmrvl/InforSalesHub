var SHIntegration;
(function (SHIntegration) {
    class QuickEntryProductConversion {
        convertProduct(productCode) {
            const promise = $.Deferred();
            var barcode = productCode ? productCode.trim() : "";
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                var request = {
                    program: "MMS200MI",
                    transaction: "GetItmByAlias",
                    record: {
                        ALAN: barcode,
                        ALTY: "EA13"
                    }
                };
                // Localizamos el invocador interno de servicios MI de Infor
                var m3Service = window.M3RestService ||
                    window.SalesHub?.M3RestService ||
                    window.SalesHubRestService;
                if (m3Service && typeof m3Service.executeMI === 'function') {
                    m3Service.executeMI(request)
                        .then(function (response) {
                        var record = response.record || response.item;
                        if (record && record.ITNO) {
                            promise.resolve({
                                itemNumber: record.ITNO.trim(),
                                quantity: "1"
                            });
                        }
                        else {
                            promise.resolve({ itemNumber: productCode, quantity: "1" });
                        }
                    })
                        .catch(function (error) {
                        console.error("Error al consultar el Alias en M3:", error);
                        promise.resolve({ itemNumber: productCode, quantity: "1" });
                    });
                }
                else {
                    // Alternativa directa si los servicios globales están restringidos por sandbox:
                    // Infor suele pasar las utilidades dentro de las dependencias inyectadas de Angular/React
                    console.warn("Buscando alternativa de ejecución nativa...");
                    // Si el puente global falla, dejamos pasar el flujo normal del core
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                }
            }
            else {
                promise.resolve({ itemNumber: productCode, quantity: "1" });
            }
            return promise;
        }
    }
    SHIntegration.QuickEntryProductConversion = QuickEntryProductConversion;
})(SHIntegration || (SHIntegration = {}));
