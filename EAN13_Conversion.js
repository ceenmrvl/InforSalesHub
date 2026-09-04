/**
 * Script de prueba básico para Infor Sales Hub
 * Lanza un alert en pantalla para confirmar que el script se ejecuta con éxito
 */
var QuickEntryConversionScript = {
    execute: function (input) {
        return new Promise(function (resolve, reject) {
            
            // Mensaje emergente directo en el navegador
            alert("¡Script ejecutándose con éxito!\nCódigo recibido: " + input);
            
            // Devolvemos el input original para que Sales Hub continúe su flujo nativo
            resolve({
                itemNumber: input ? input.trim() : "",
                quantity: 2
            });
            
        });
    }
};

QuickEntryConversionScript;
