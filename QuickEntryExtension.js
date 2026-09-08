var SHIntegration;
(function (SHIntegration) {
    // Usamos el nombre exacto de clase que el SDK y Sales Hub exigen para este exit point
    class QuickEntryProductConversion {
        convertProduct(productCode) {
            const promise = $.Deferred();
            // Ventana emergente para validar en vivo si Sales Hub cargó este script
            alert("¡Script de Entrada Rápida inyectado con éxito! Código recibido: " + productCode);
            // Devolvemos el mismo código intacto para que la app continúe sin romperse
            promise.resolve({
                itemNumber: productCode,
                quantity: '1'
            });
            return promise;
        }
    }
    SHIntegration.QuickEntryProductConversion = QuickEntryProductConversion;
})(SHIntegration || (SHIntegration = {}));
