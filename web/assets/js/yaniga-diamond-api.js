(function () {
    const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const apiBaseUrl = window.YANIGA_API_BASE_URL || (isLocal ? 'http://localhost:3001/api' : 'https://diamonds-dusky.vercel.app/api');

    function loadPartial(targetId, fileName, onLoaded) {
        const target = document.getElementById(targetId);
        if (!target) return;

        fetch(fileName)
            .then((response) => response.text())
            .then((html) => {
                target.innerHTML = html;
                if (typeof onLoaded === 'function') {
                    onLoaded();
                }
            })
            .catch((error) => console.error(`Error loading ${fileName}:`, error));
    }

    async function fetchDiamondsByShape(shape, filters, options) {
        const shapeParam = String(shape || 'ROUND').trim().toUpperCase();
        const page = Number.parseInt(options?.page, 10) || 1;
        const limit = Number.parseInt(options?.limit, 10) || 50;
        const signal = options?.signal;

        const endpoint = new URL(`${apiBaseUrl}/products/diamonds/${encodeURIComponent(shapeParam)}`);
        endpoint.searchParams.set('page', String(page));
        endpoint.searchParams.set('limit', String(limit));

        const response = await fetch(endpoint.toString(), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(filters),
            signal: signal || undefined
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();
        return {
            status: result.status || 'success',
            data: Array.isArray(result.data) ? result.data : [],
            total: Number.isFinite(result.total) ? result.total : 0,
            count: Number.isFinite(result.count) ? result.count : 0,
            page: Number.isFinite(result.page) ? result.page : page,
            limit: Number.isFinite(result.limit) ? result.limit : limit,
            totalPages: Number.isFinite(result.totalPages) ? result.totalPages : 0,
            hasNextPage: Boolean(result.hasNextPage),
            hasPrevPage: Boolean(result.hasPrevPage)
        };
    }

    window.YanigaDiamondApi = {
        apiBaseUrl,
        loadPartial,
        fetchDiamondsByShape
    };
})();