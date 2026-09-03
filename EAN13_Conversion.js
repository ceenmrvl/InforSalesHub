/**
 * Script de conversión para Infor Sales Hub - Quick Entry
 * Con Logs detallados de depuración y manejo de estructuras M3
 */
(function () {
    return {
        execute: function (input) {
            return new Promise(function (resolve, reject) {
                console.log("[SalesHub Script] --- Inicio de Ejecución ---");
                console.log("[SalesHub Script] Valor de entrada (input):", input);

                var barcode = input ? input.trim() : "";
                var prefix = "7"; 

                // Validación y remoción manual del prefijo si Sales Hub no lo limpió nativamente
                if (barcode.indexOf(prefix) === 0) {
                    console.log("[SalesHub Script] Prefijo '" + prefix + "' detectado al inicio. Removiendo...");
                    barcode = barcode.substring(prefix.length);
                }

                console.log("[SalesHub Script] Código de barras a consultar en M3:", barcode);

                if (barcode.length > 0 && !isNaN(barcode)) {
                    var request = {
                        program: "MMS200MI",
                        transaction: "GetItmByAlias", 
                        record: { 
                            ALAN: barcode, 
                            ALTY: "EA13"   
                        }
                    };

                    console.log("[SalesHub Script] Enviando Request a executeMI:", JSON.stringify(request));

                    SalesHubRestService.executeMI(request)
                        .then(function (response) {
                            console.log("[SalesHub Script] Respuesta completa recibida de M3:", JSON.stringify(response));
                            
                            // Intentar ubicar el registro en las diferentes estructuras posibles de Infor MI
                            var record = null;
                            
                            if (response) {
                                if (response.record) record = response.record;
                                else if (response.item) record = response.item;
                                else if (response.items && response.items.length > 0) record = response.items[0];
                                else if (response.records && response.records.length > 0) record = response.records[0];
                            }

                            if (record && record.ITNO) {
                                var itemResolved = record.ITNO.trim();
                                console.log("[SalesHub Script] ¡Éxito! Artículo traducido encontrado:", itemResolved);
                                
                                resolve({
                                    itemNumber: itemResolved,
                                    quantity: 1
                                });
                            } else {
                                console.warn("[SalesHub Script] La API respondió pero no se encontró la propiedad ITNO en la estructura.");
                                resolve({
                                    itemNumber: input,
                                    quantity: 1
                                });
                            }
                        })
                        .catch(function (error) {
                            console.error("[SalesHub Script] Error crítico en la llamada a SalesHubRestService.executeMI:", error);
                            resolve({
                                itemNumber: input,
                                quantity: 1
                            });
                        });
                } else {
                    console.log("[SalesHub Script] El formato del código no es válido para conversión de alias. Se envía original.");
                    resolve({
                        itemNumber: input,
                        quantity: 1
                    });
                }
            });
        }
    };
})();
