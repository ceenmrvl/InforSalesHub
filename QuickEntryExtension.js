var SHIntegration;
(function (SHIntegration) {
    // Cambiamos el nombre de la clase para evitar el error de duplicidad
    class CustomQuickEntryConversion {
        // El SDK exige retornar estrictamente la interfaz QuickEntryProductConversionCheckResponse
        convertProduct(productCode) {
            const promise = $.Deferred();
            // 1. Limpiar espacios en blanco (MANTENIENDO el 7 inicial intacto)
            var barcode = productCode ? productCode.trim() : "";
            // 2. Regla de validación numérica
            if (barcode.length > 0 && !isNaN(Number(barcode))) {
                var request = {
                    program: "MMS200MI",
                    transaction: "GetItmByAlias",
                    record: {
                        ALAN: barcode,
                        ALTY: "EA13"
                    }
                };
                // Acceso seguro al servicio REST global evitando el error "Cannot find name"
                var restService = window.SalesHubRestService || window.SalesHub?.RestService;
                if (restService) {
                    restService.executeMI(request)
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
                    promise.resolve({ itemNumber: productCode, quantity: "1" });
                }
            }
            else {
                promise.resolve({ itemNumber: productCode, quantity: "1" });
            }
            return promise;
        }
    }
    SHIntegration.CustomQuickEntryConversion = CustomQuickEntryConversion;
    // Vinculamos tu clase personalizada al nombre oficial que el núcleo de Sales Hub buscará en producción
    SHIntegration.QuickEntryProductConversion = CustomQuickEntryConversion;
})(SHIntegration || (SHIntegration = {}));
