# Instrucciones de actualización

1. Haz una copia de seguridad de Neon antes de modificar el esquema.
2. En Neon SQL Editor ejecuta el archivo `database/migrations/006_product_models.sql` completo.
3. Confirma que existen `product_models`, `product_price_history` y `warehouse_products.product_model_id`.
4. Despliega el código actualizado.
5. Abre Productos > Catálogo y crea los modelos maestros.
6. Abre Productos > Existencias y registra cada SKU seleccionando el modelo.
7. Registra primero un modelo y un SKU inicial controlado; verifica catálogo, cotizador y existencias antes de cargar toda la tabla comercial.

No ejecutes esta migración más de una vez por costumbre: usa `IF NOT EXISTS`, pero revisa el resultado si una ejecución anterior terminó parcialmente. La migración es aditiva, pero el backup previo sigue siendo obligatorio.
