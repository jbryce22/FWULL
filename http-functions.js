import { ok, badRequest } from 'wix-http-functions';
import { products } from 'wix-stores.v2';
import { PRODUCT_MAP } from 'public/constants.js';

// This map matches the exact division string coming from your registration form
const DIVISION_TO_PRODUCT = PRODUCT_MAP;

export async function get_get_product(request) {
    try {
        // Read the division from the query string (?division=Baseball%20Majors%20-%202026.1)
        const url = new URL(request.url);
        const division = url.searchParams.get('division');

        if (!division) {
            console.error('[get_product] Missing division parameter');
            return badRequest({ body: "Missing division parameter" });
        }

        // Validate division format to prevent injection/abuse
        if (typeof division !== 'string' || division.length > 100) {
            console.error('[get_product] Invalid division format:', division);
            return badRequest({ body: "Invalid division format" });
        }

        // Validate division exists in our product map (prevents arbitrary input)
        const productId = DIVISION_TO_PRODUCT[division];
        if (!productId) {
            console.warn('[get_product] No product found for division:', division);
            return badRequest({ body: `No product found for division: ${division}` });
        }

        // Fetch product from Wix Stores API
        const { product } = await products.getProduct(productId);

        if (!product) {
            console.error('[get_product] Product not found for ID:', productId);
            return badRequest({ body: "Product not found in store" });
        }

        const finalProductId = product._id || product.id;

        let variantId = null;
        if (product.manageVariants && product.variants?.length > 0) {
            variantId = product.variants[0]._id || product.variants[0].id;
        }

        console.log('[get_product] Successfully retrieved product:', finalProductId);

        return ok({
            body: JSON.stringify({
                productId: finalProductId,
                variantId,
                productName: product.name
            }),
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("[get_product] Unexpected error:", error);
        return badRequest({
            body: JSON.stringify({
                error: "Failed to retrieve product",
                details: error.message
            }),
            headers: { "Content-Type": "application/json" }
        });
    }
}
