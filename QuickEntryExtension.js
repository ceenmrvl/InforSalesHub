var SHIntegration;
(function (SHIntegration) {
    // Usamos el nombre estricto de la clase de conversión
    class QuickEntryProductConversion {
        convertProduct(productCode) {
            const promise = $.Deferred();
            // 1. Limpiar espacios en blanco (Manteniendo el código con el "7" inicial intacto)
            var barcode = productCode ? productCode.trim() : "";
            // 2. Validación numérica antes de llamar al ERP
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                var request = {
                    program: "MMS200MI",
                    transaction: "GetItmByAlias",
                    record: {
                        ALAN: barcode,
                        ALTY: "EA13" // Tipo de alias de tu pantalla MMS025
                    }
                };
                // Acceso seguro al motor REST interno de Infor en el navegador
                var restService = window.SalesHubRestService || window.SalesHub?.RestService;
                if (restService) {
                    restService.executeMI(request)
                        .then(function (response) {
                        var record = response.record || response.item;
                        // Si M3 encuentra el artículo (ITNO), devolvemos su código interno corto
                        if (record && record.ITNO) {
                            promise.resolve({
                                itemNumber: record.ITNO.trim(),
                                quantity: "1"
                            });
                        }
                        else {
                            // Si no lo encuentra, pasamos el código original para que no falle la experiencia del usuario
                            promise.resolve({ itemNumber: productCode, quantity: "1" });
                        }
                    })
                        .catch(function (error) {
                        console.error("Error al consultar el Alias en M3:", error);
                        promise.resolve({ itemNumber: productCode, quantity: "1" });
                    });
                }
                else {
                    console.warn("Servicio REST de Sales Hub no disponible en el contexto actual.");
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
