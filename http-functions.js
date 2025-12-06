import { ok, badRequest } from 'wix-http-functions';
import { products } from 'wix-stores.v2';

// This map matches the exact division string coming from your registration form
const DIVISION_TO_PRODUCT = {
    "Baseball PeeWee 4/5 - 2026.1": "cb99e32f-dfe8-4ac6-bc91-e284cd28052b",
    "Baseball PeeWee 6 - 2026.1":   "3dbd979b-3e1c-4484-bfa6-5a28edad1119",
    "Baseball Coach Pitch - 2026.1": "b04c9c65-b8bb-4fcb-bac6-452042405041",
    "Baseball Lower Minors - 2026.1": "118a78b8-6993-4807-8df3-8032b757fce0",
    "Baseball Upper Minors - 2026.1": "b2ab369d-9c79-4d32-b01e-58af694a5b18",
    "Baseball Majors - 2026.1":      "5d799042-713c-408f-b744-2be1effcc8d5",
    "Baseball 13U Intermediate - 2026.1": "b0321246-32d6-4619-a472-92030ef5d063",
    "Baseball 14U Junior - 2026.1": "a520c83e-cb40-4987-b448-09563f963010",
    "Softball Majors - 2026.1":     "ac9051d6-5da6-4887-a650-0f5f196a92b9",
    "Softball Minors - 2026.1":     "9275d7d7-2810-4ef5-ba64-35a0cd109797",
    "Softball Coach Pitch - 2026.1": "d14e677f-78d8-4cd3-9d3f-13a880a6bdac",
    "Softball Daisy League - 2026.1": "5abbb0c6-dc69-4ada-9600-5c47d063c33e",
    "Majors": "5abbb0c6-dc69-4ada-9600-5c47d063c33e"
};

export async function get_get_product(request) {
    try {
        // Read the division from the query string (?division=Baseball%20Majors%20-%202026.1)
        const url = new URL(request.url);
        const division = url.searchParams.get('division');

        if (!division) {
            return badRequest({ body: "Missing division parameter" });
        }

        const productId = DIVISION_TO_PRODUCT[division];
        if (!productId) {
            return badRequest({ body: `No product found for division: ${division}` });
        }

        const { product } = await products.getProduct(productId);
        const finalProductId = product._id || product.id;

        let variantId = null;
        if (product.manageVariants && product.variants?.length > 0) {
            variantId = product.variants[0]._id || product.variants[0].id;
        }

        return ok({
            body: JSON.stringify({
                productId: finalProductId,
                variantId,
                productName: product.name
            }),
            headers: { "Content-Type": "application/json" }
        });

    } catch (error) {
        console.error("get_get_product error:", error);
        return badRequest({
            body: JSON.stringify({ error: error.message })
        });
    }
}
