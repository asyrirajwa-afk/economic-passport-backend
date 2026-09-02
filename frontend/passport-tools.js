const API_URL =
    "http://127.0.0.1:8000";


// ========================================
// TOKEN
// ========================================

const token =
    localStorage.getItem("token") ||
    localStorage.getItem("access_token");


// ========================================
// BUSINESS ID
// ========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const businessId =
    params.get("business_id") ||
    localStorage.getItem(
        "selected_business_id"
    ) ||
    localStorage.getItem(
        "last_business_id"
    );


// ========================================
// ELEMENT
// ========================================

const loadingState =
    document.getElementById(
        "loadingState"
    );

const errorState =
    document.getElementById(
        "errorState"
    );

const content =
    document.getElementById(
        "content"
    );

const errorMessage =
    document.getElementById(
        "errorMessage"
    );

const retryButton =
    document.getElementById(
        "retryButton"
    );

const errorBackButton =
    document.getElementById(
        "errorBackButton"
    );

const backButton =
    document.getElementById(
        "backButton"
    );

const logoutButton =
    document.getElementById(
        "logoutButton"
    );


// ========================================
// PASSPORT SUMMARY
// ========================================

const businessName =
    document.getElementById(
        "businessName"
    );

const passportId =
    document.getElementById(
        "passportId"
    );

const overallScore =
    document.getElementById(
        "overallScore"
    );

const passportStatus =
    document.getElementById(
        "passportStatus"
    );

const exportBusinessName =
    document.getElementById(
        "exportBusinessName"
    );


// ========================================
// SHARE
// ========================================

const generateShareButton =
    document.getElementById(
        "generateShareButton"
    );

const shareResult =
    document.getElementById(
        "shareResult"
    );

const shareLink =
    document.getElementById(
        "shareLink"
    );

const copyShareButton =
    document.getElementById(
        "copyShareButton"
    );

const shareMessage =
    document.getElementById(
        "shareMessage"
    );


// ========================================
// QR
// ========================================

const qrContainer =
    document.getElementById(
        "qrContainer"
    );

const qrImage =
    document.getElementById(
        "qrImage"
    );

const qrLoading =
    document.getElementById(
        "qrLoading"
    );

const loadQrButton =
    document.getElementById(
        "loadQrButton"
    );

const downloadQrButton =
    document.getElementById(
        "downloadQrButton"
    );

const qrMessage =
    document.getElementById(
        "qrMessage"
    );


// ========================================
// EXPORT
// ========================================

const exportButton =
    document.getElementById(
        "exportButton"
    );

const exportMessage =
    document.getElementById(
        "exportMessage"
    );


// ========================================
// CEK AUTH
// ========================================

if (!token) {

    window.location.href =
        "index.html";

}


// ========================================
// CEK BUSINESS ID
// ========================================

if (!businessId) {

    showError(
        "Business ID tidak ditemukan."
    );

} else {

    localStorage.setItem(
        "selected_business_id",
        businessId
    );

    localStorage.setItem(
        "last_business_id",
        businessId
    );

    loadPassportData();

}


// ========================================
// HEADER AUTH
// ========================================

function getHeaders() {

    return {

        "Authorization":
            `Bearer ${token}`,

        "Content-Type":
            "application/json"

    };

}


// ========================================
// LOAD PASSPORT DATA
// ========================================

async function loadPassportData() {

    showLoading();

    try {

        /*
         * Gunakan SCORE BREAKDOWN
         * karena endpoint ini mengembalikan
         * passport.id secara langsung.
         */

        const response =
            await fetch(
                `${API_URL}/passport/${businessId}/score-breakdown`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        let data = {};

        try {

            data =
                await response.json();

        } catch (jsonError) {

            console.error(
                "PASSPORT RESPONSE BUKAN JSON:",
                jsonError
            );

        }


        console.log(
            "SCORE BREAKDOWN RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                `Data passport gagal dimuat (${response.status})`
            );

        }


        renderPassportData(
            data
        );


        showContent();

    }

    catch (error) {

        console.error(
            "LOAD PASSPORT ERROR:",
            error
        );


        showError(
            error.message ||
            "Data passport tidak dapat dimuat."
        );

    }

}


// ========================================
// RENDER PASSPORT
// ========================================

function renderPassportData(data) {

    /*
     * RESPONSE SCORE BREAKDOWN:
     *
     * {
     *     "business": {
     *         "id": ...,
     *         "business_name": "..."
     *     },
     *
     *     "passport": {
     *         "id": ...,
     *         "overall_score": ...,
     *         "status": "...",
     *         "created_at": "..."
     *     }
     * }
     */


    const passport =
        data.passport || {};


    const business =
        data.business || {};


    // ========================================
    // BUSINESS NAME
    // ========================================

    const name =
        business.business_name ||
        "Economic Passport";


    if (businessName) {

        businessName.textContent =
            name;

    }


    if (exportBusinessName) {

        exportBusinessName.textContent =
            name;

    }


    // ========================================
    // PASSPORT ID
    // ========================================

    if (passportId) {

        passportId.textContent =
            passport.id ||
            "-";

    }


    // ========================================
    // OVERALL SCORE
    // ========================================

    const score =
        passport.overall_score;


    if (
        overallScore &&
        score !== undefined &&
        score !== null
    ) {

        overallScore.textContent =
            `${Number(score).toFixed(2)} / 100`;

    }


    // ========================================
    // STATUS
    // ========================================

    if (passportStatus) {

        passportStatus.textContent =
            passport.status ||
            "-";

    }


    // ========================================
    // SIMPAN PASSPORT ID
    // ========================================

    if (passport.id) {

        localStorage.setItem(
            "selected_passport_id",
            passport.id
        );

    }

}


// ========================================
// SHARE PASSPORT
// ========================================

generateShareButton.addEventListener(
    "click",
    async function () {

        shareMessage.textContent = "";
        shareMessage.style.color = "#6b7280";

        generateShareButton.disabled = true;
        generateShareButton.textContent = "Membuat link...";

        try {

            const response = await fetch(
                `${API_URL}/passport/${businessId}/share`,
                {
                    method: "POST",
                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            let data = {};

            try {
                data = await response.json();
            } catch (jsonError) {
                console.error(
                    "RESPONSE SHARE BUKAN JSON:",
                    jsonError
                );
            }

            console.log(
                "SHARE RESPONSE:",
                data
            );


            if (!response.ok) {

                throw new Error(
                    data.detail ||
                    data.message ||
                    `Gagal membuat share link (${response.status})`
                );

            }


            /*
             * BACKEND RESPONSE:
             *
             * {
             *     "share": {
             *         "token": "EP-..."
             *     },
             *     "public_url":
             *         "/passport/public/EP-..."
             * }
             */


            const publicPath =
                data.public_url;


            if (!publicPath) {

                throw new Error(
                    "Public URL tidak ditemukan pada response server."
                );

            }


            /*
             * Gabungkan API URL dengan
             * public URL dari backend.
             */

            const finalLink =
                publicPath.startsWith("http")
                    ? publicPath
                    : `${API_URL}${publicPath}`;


            /*
             * Tampilkan link
             */

            shareLink.value =
                finalLink;


            shareResult.classList.remove(
                "hidden"
            );


            shareMessage.style.color =
                "#16a34a";

            shareMessage.textContent =
                "Share link berhasil dibuat.";


            console.log(
                "PUBLIC SHARE LINK:",
                finalLink
            );

        }

        catch (error) {

            console.error(
                "SHARE ERROR:",
                error
            );


            shareMessage.style.color =
                "#dc2626";

            shareMessage.textContent =
                error.message ||
                "Gagal membuat share link.";

        }

        finally {

            generateShareButton.disabled =
                false;

            generateShareButton.textContent =
                "Generate Share Link";

        }

    }
);


// ========================================
// COPY SHARE LINK
// ========================================

copyShareButton.addEventListener(
    "click",
    async function () {

        const link =
            shareLink.value.trim();


        if (!link) {

            return;

        }


        try {

            await navigator.clipboard.writeText(
                link
            );


            copyShareButton.textContent =
                "Copied!";


            shareMessage.style.color =
                "#16a34a";

            shareMessage.textContent =
                "Link berhasil disalin.";


            setTimeout(
                function () {

                    copyShareButton.textContent =
                        "Copy";

                },
                1500
            );

        }

        catch (error) {

            console.error(
                "COPY ERROR:",
                error
            );


            shareLink.select();

            document.execCommand(
                "copy"
            );


            copyShareButton.textContent =
                "Copied!";


            setTimeout(
                function () {

                    copyShareButton.textContent =
                        "Copy";

                },
                1500
            );

        }

    }
);


// ========================================
// LOAD EXISTING SHARE
// ========================================

async function loadExistingShare() {

    try {

        const response =
            await fetch(
                `${API_URL}/passport/${businessId}/share`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        if (!response.ok) {

            return;

        }


        const data =
            await response.json();


        console.log(
            "EXISTING SHARE RESPONSE:",
            data
        );


        /*
         * Endpoint GET /share memberikan
         * data share passport.
         *
         * Jika backend mengembalikan public_url,
         * gunakan langsung.
         */

        const publicPath =
            data.public_url;


        if (!publicPath) {

            return;

        }


        const finalLink =
            publicPath.startsWith("http")
                ? publicPath
                : `${API_URL}${publicPath}`;


        shareLink.value =
            finalLink;


        shareResult.classList.remove(
            "hidden"
        );


        shareMessage.style.color =
            "#16a34a";

        shareMessage.textContent =
            "Share link tersedia.";

    }

    catch (error) {

        console.log(
            "SHARE LINK BELUM TERSEDIA:",
            error
        );

    }

}

// ========================================
// LOAD QR
// ========================================

loadQrButton.addEventListener(
    "click",
    loadQr
);


async function loadQr() {

    loadQrButton.disabled =
        true;

    loadQrButton.textContent =
        "Memuat QR...";

    qrMessage.textContent =
        "";


    try {

        const response =
            await fetch(
                `${API_URL}/passport/${businessId}/qr`,
                {
                    method: "GET",
                    headers: getHeaders()
                }
            );


        const data =
            await response.json();


        console.log(
            "QR RESPONSE:",
            data
        );


        if (!response.ok) {

            throw new Error(
                data.detail ||
                "QR Code tidak dapat dimuat."
            );

        }


        /*
            BACKEND RESPONSE:

            {
                "business": {...},
                "passport": {...},
                "qr": {
                    "data": "/passport/verify/...",
                    "passport_id": ...,
                    "verification_path": "...",
                    "payload": {...}
                }
            }
        */

        const qr =
            data.qr || {};


        const verificationPath =
            qr.verification_path ||
            qr.data;


        if (!verificationPath) {

            throw new Error(
                "Verification path tidak ditemukan."
            );

        }


        /*
            Karena backend hanya memberikan
            DATA QR, bukan gambar QR,
            kita buat QR di frontend.
        */

        const verificationUrl =
            `${API_URL}${verificationPath}`;


        // Bersihkan QR lama

        qrContainer.innerHTML = "";


        // Buat container QR baru

        const qrElement =
            document.createElement(
                "div"
            );


        qrElement.id =
            "generatedQr";


        qrContainer.appendChild(
            qrElement
        );


        // =================================
        // GENERATE QR
        // =================================

        if (
            typeof QRCode ===
            "undefined"
        ) {

            throw new Error(
                "Library QR Code belum dimuat."
            );

        }


        new QRCode(
            qrElement,
            {
                text:
                    verificationUrl,

                width:
                    170,

                height:
                    170,

                correctLevel:
                    QRCode.CorrectLevel.M
            }
        );


        // =================================
        // SIMPAN URL QR
        // =================================

        qrContainer.dataset.qrUrl =
            verificationUrl;


        // =================================
        // DOWNLOAD BUTTON
        // =================================

        downloadQrButton.classList.remove(
            "hidden"
        );


        qrMessage.style.color =
            "#16a34a";

        qrMessage.textContent =
            "QR Code berhasil dibuat.";


    }

    catch (error) {

        console.error(
            "QR ERROR:",
            error
        );


        qrMessage.style.color =
            "#dc2626";

        qrMessage.textContent =
            error.message ||
            "Gagal membuat QR Code.";

    }

    finally {

        loadQrButton.disabled =
            false;

        loadQrButton.textContent =
            "Tampilkan QR";

    }

}


// ========================================
// DOWNLOAD QR
// ========================================

downloadQrButton.addEventListener(
    "click",
    function () {

        const qrElement =
            document.getElementById(
                "generatedQr"
            );


        if (!qrElement) {

            return;

        }


        const canvas =
            qrElement.querySelector(
                "canvas"
            );


        if (!canvas) {

            qrMessage.style.color =
                "#dc2626";

            qrMessage.textContent =
                "QR belum tersedia untuk di-download.";

            return;

        }


        const link =
            document.createElement(
                "a"
            );


        link.href =
            canvas.toDataURL(
                "image/png"
            );


        link.download =
            `economic-passport-qr-${businessId}.png`;


        document.body.appendChild(
            link
        );


        link.click();


        document.body.removeChild(
            link
        );

    }
);


// ========================================
// EXPORT PASSPORT
// ========================================

exportButton.addEventListener(
    "click",
    exportPassport
);


async function exportPassport() {

    exportMessage.textContent = "";
    exportMessage.style.color = "#6b7280";

    exportButton.disabled = true;
    exportButton.textContent = "Membuat PDF...";


    try {

        // ========================================
        // AMBIL DATA DARI BACKEND
        // ========================================

        const response =
            await fetch(
                `${API_URL}/passport/${encodeURIComponent(
                    businessId
                )}/export`,
                {
                    method: "GET",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    }
                }
            );


        let data = {};

        try {

            data =
                await response.json();

        } catch (error) {

            console.error(
                "Response export bukan JSON:",
                error
            );

        }


        if (!response.ok) {

            throw new Error(
                data.detail ||
                data.message ||
                `Export gagal (${response.status})`
            );

        }


        // ========================================
        // CEK jsPDF
        // ========================================

        if (
            typeof window.jspdf ===
            "undefined"
        ) {

            throw new Error(
                "Library PDF belum dimuat."
            );

        }


        const {
            jsPDF
        } = window.jspdf;


        // ========================================
        // DATA
        // ========================================

        const business =
            data.business || {};

        const passport =
            data.passport || {};

        const categories =
            Array.isArray(data.categories)
                ? data.categories
                : [];

        const target =
            data.target || {};

        const validity =
            data.validity || {};


        const businessNameValue =
            business.business_name ||
            "Economic Passport";

        const passportNumber =
            passport.id ||
            "-";

        const overallScore =
            Number(
                passport.overall_score ?? 0
            );

        const level =
            passport.level ||
            "-";

        const status =
            passport.status ||
            "-";


        // ========================================
        // PDF
        // ========================================

        const doc =
            new jsPDF({
                orientation: "portrait",
                unit: "mm",
                format: "a4"
            });


        const pageWidth =
            doc.internal.pageSize.getWidth();

        const pageHeight =
            doc.internal.pageSize.getHeight();


        const margin = 18;

        let y = 0;


        // ========================================
        // WARNA
        // ========================================

        const navy = [31, 78, 121];

        const dark = [31, 41, 55];

        const gray = [107, 114, 128];

        const lightGray = [243, 246, 249];

        const border = [225, 229, 234];

        const green = [22, 163, 74];

        const red = [220, 38, 38];

        const orange = [217, 119, 6];


        // ========================================
        // HEADER
        // ========================================

        doc.setFillColor(
            navy[0],
            navy[1],
            navy[2]
        );

        doc.rect(
            0,
            0,
            pageWidth,
            38,
            "F"
        );


        // EP LOGO

        doc.setFillColor(
            255,
            255,
            255
        );

        doc.roundedRect(
            margin,
            9,
            20,
            20,
            4,
            4,
            "F"
        );


        doc.setTextColor(
            navy[0],
            navy[1],
            navy[2]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            11
        );

        doc.text(
            "EP",
            margin + 10,
            21.5,
            {
                align: "center"
            }
        );


        // TITLE

        doc.setTextColor(
            255,
            255,
            255
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            16
        );

        doc.text(
            "ECONOMIC PASSPORT",
            margin + 27,
            16
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(
            8
        );

        doc.text(
            "Business Intelligence for Better Decisions",
            margin + 27,
            22
        );


        // STATUS HEADER

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            8
        );

        doc.text(
            status.toUpperCase(),
            pageWidth - margin,
            16,
            {
                align: "right"
            }
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.text(
            "PASSPORT REPORT",
            pageWidth - margin,
            22,
            {
                align: "right"
            }
        );


        y = 50;


        // ========================================
        // BUSINESS INFORMATION
        // ========================================

        doc.setTextColor(
            dark[0],
            dark[1],
            dark[2]
        );


        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            20
        );

        doc.text(
            businessNameValue,
            margin,
            y
        );


        y += 7;


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(
            9
        );

        doc.setTextColor(
            gray[0],
            gray[1],
            gray[2]
        );

        doc.text(
            `Passport ID: ${passportNumber}`,
            margin,
            y
        );


        if (
            passport.created_at
        ) {

            const date =
                new Date(
                    passport.created_at
                );


            if (
                !isNaN(
                    date.getTime()
                )
            ) {

                doc.text(
                    `Assessment: ${date.toLocaleDateString(
                        "id-ID"
                    )}`,
                    margin + 55,
                    y
                );

            }

        }


        y += 13;


        // ========================================
        // SCORE CARD
        // ========================================

        doc.setFillColor(
            lightGray[0],
            lightGray[1],
            lightGray[2]
        );

        doc.roundedRect(
            margin,
            y,
            pageWidth - margin * 2,
            48,
            5,
            5,
            "F"
        );


        // LEFT LABEL

        doc.setTextColor(
            gray[0],
            gray[1],
            gray[2]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            8
        );

        doc.text(
            "OVERALL SCORE",
            margin + 10,
            y + 11
        );


        // SCORE

        doc.setTextColor(
            navy[0],
            navy[1],
            navy[2]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            27
        );

        doc.text(
            `${overallScore.toFixed(2)}`,
            margin + 10,
            y + 29
        );


        doc.setFontSize(
            10
        );

        doc.setTextColor(
            gray[0],
            gray[1],
            gray[2]
        );

        doc.text(
            "/ 100",
            margin + 49,
            y + 29
        );


        // LEVEL

        doc.setFillColor(
            navy[0],
            navy[1],
            navy[2]
        );

        doc.roundedRect(
            pageWidth - margin - 45,
            y + 10,
            35,
            12,
            6,
            6,
            "F"
        );


        doc.setTextColor(
            255,
            255,
            255
        );

        doc.setFontSize(
            8
        );

        doc.text(
            level.toUpperCase(),
            pageWidth - margin - 27.5,
            y + 17.5,
            {
                align: "center"
            }
        );


        y += 60;


        // ========================================
        // CATEGORY PERFORMANCE
        // ========================================

        doc.setTextColor(
            dark[0],
            dark[1],
            dark[2]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            12
        );

        doc.text(
            "CATEGORY PERFORMANCE",
            margin,
            y
        );


        y += 7;


        // TABLE CONTAINER

        const tableWidth =
            pageWidth - margin * 2;

        const rowHeight = 10;

        const categoryX =
            margin + 5;

        const scoreX =
            margin + 105;

        const ratingX =
            margin + 145;


        // TABLE HEADER

        doc.setFillColor(
            navy[0],
            navy[1],
            navy[2]
        );

        doc.roundedRect(
            margin,
            y,
            tableWidth,
            10,
            2,
            2,
            "F"
        );


        doc.setTextColor(
            255,
            255,
            255
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            8
        );


        doc.text(
            "CATEGORY",
            categoryX,
            y + 6.5
        );


        doc.text(
            "SCORE",
            scoreX,
            y + 6.5
        );


        doc.text(
            "RATING",
            ratingX,
            y + 6.5
        );


        y += 10;


        // ========================================
        // CATEGORY ROWS
        // ========================================

        categories.forEach(
            function (category, index) {

                const categoryName =
                    category.category ||
                    "-";

                const score =
                    Number(
                        category.score ?? 0
                    );

                const rating =
                    category.rating ||
                    "-";


                // background

                if (
                    index % 2 === 0
                ) {

                    doc.setFillColor(
                        249,
                        250,
                        251
                    );

                } else {

                    doc.setFillColor(
                        255,
                        255,
                        255
                    );

                }


                doc.rect(
                    margin,
                    y,
                    tableWidth,
                    rowHeight,
                    "F"
                );


                // border

                doc.setDrawColor(
                    border[0],
                    border[1],
                    border[2]
                );

                doc.rect(
                    margin,
                    y,
                    tableWidth,
                    rowHeight
                );


                // category

                doc.setTextColor(
                    dark[0],
                    dark[1],
                    dark[2]
                );

                doc.setFont(
                    "helvetica",
                    "bold"
                );

                doc.setFontSize(
                    8
                );

                doc.text(
                    String(categoryName),
                    categoryX,
                    y + 6.5
                );


                // score

                doc.setFont(
                    "helvetica",
                    "normal"
                );

                doc.text(
                    score.toFixed(2),
                    scoreX,
                    y + 6.5
                );


                // rating

                doc.setFont(
                    "helvetica",
                    "bold"
                );


                if (
                    rating === "D" ||
                    rating === "E" ||
                    rating === "F"
                ) {

                    doc.setTextColor(
                        red[0],
                        red[1],
                        red[2]
                    );

                }

                else if (
                    rating === "C"
                ) {

                    doc.setTextColor(
                        orange[0],
                        orange[1],
                        orange[2]
                    );

                }

                else {

                    doc.setTextColor(
                        green[0],
                        green[1],
                        green[2]
                    );

                }


                doc.text(
                    String(rating),
                    ratingX,
                    y + 6.5
                );


                y += rowHeight;

            }
        );


        y += 13;


        // ========================================
        // TARGET PERFORMANCE
        // ========================================

        doc.setTextColor(
            dark[0],
            dark[1],
            dark[2]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            12
        );

        doc.text(
            "TARGET PERFORMANCE",
            margin,
            y
        );


        y += 9;


        const targetScore =
            Number(
                target.target_score ?? 80
            );


        const targetGap =
            Number(
                target.gap ?? 0
            );


        const achieved =
            target.achieved === true;


        // TARGET NUMBER

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            20
        );

        doc.setTextColor(
            navy[0],
            navy[1],
            navy[2]
        );

        doc.text(
            targetScore.toFixed(0),
            pageWidth - margin,
            y,
            {
                align: "right"
            }
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(
            8
        );

        doc.setTextColor(
            gray[0],
            gray[1],
            gray[2]
        );

        doc.text(
            "TARGET SCORE",
            pageWidth - margin,
            y + 6,
            {
                align: "right"
            }
        );


        y += 10;


        // PROGRESS BAR

        const barWidth =
            pageWidth - margin * 2;

        const barHeight = 5;


        doc.setFillColor(
            229,
            231,
            235
        );

        doc.roundedRect(
            margin,
            y,
            barWidth,
            barHeight,
            2.5,
            2.5,
            "F"
        );


        const progress =
            Math.min(
                Math.max(
                    overallScore / targetScore,
                    0
                ),
                1
            );


        doc.setFillColor(
            navy[0],
            navy[1],
            navy[2]
        );

        doc.roundedRect(
            margin,
            y,
            barWidth * progress,
            barHeight,
            2.5,
            2.5,
            "F"
        );


        y += 11;


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(
            9
        );


        doc.setTextColor(
            gray[0],
            gray[1],
            gray[2]
        );


        doc.text(
            `Gap to target: ${targetGap.toFixed(2)} points`,
            margin,
            y
        );


        doc.setFont(
            "helvetica",
            "bold"
        );


        if (achieved) {

            doc.setTextColor(
                green[0],
                green[1],
                green[2]
            );

            doc.text(
                "TARGET ACHIEVED",
                pageWidth - margin,
                y,
                {
                    align: "right"
                }
            );

        } else {

            doc.setTextColor(
                orange[0],
                orange[1],
                orange[2]
            );

            doc.text(
                "TARGET NOT YET ACHIEVED",
                pageWidth - margin,
                y,
                {
                    align: "right"
                }
            );

        }


        y += 17;


        // ========================================
        // PASSPORT VALIDITY
        // ========================================

        doc.setTextColor(
            dark[0],
            dark[1],
            dark[2]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            12
        );

        doc.text(
            "PASSPORT VALIDITY",
            margin,
            y
        );


        y += 9;


        const validityDays =
            validity.validity_days ??
            90;


        const ageDays =
            validity.age_days ??
            0;


        const remainingDays =
            validity.remaining_days ??
            0;


        const validityStatus =
            validity.status ||
            "Valid";


        // VALIDITY CARD

        doc.setFillColor(
            lightGray[0],
            lightGray[1],
            lightGray[2]
        );

        doc.roundedRect(
            margin,
            y,
            pageWidth - margin * 2,
            25,
            4,
            4,
            "F"
        );


        // STATUS DOT

        doc.setFillColor(
            green[0],
            green[1],
            green[2]
        );

        doc.circle(
            margin + 10,
            y + 12.5,
            3,
            "F"
        );


        doc.setTextColor(
            dark[0],
            dark[1],
            dark[2]
        );

        doc.setFont(
            "helvetica",
            "bold"
        );

        doc.setFontSize(
            10
        );

        doc.text(
            validityStatus,
            margin + 17,
            y + 10
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(
            8
        );

        doc.setTextColor(
            gray[0],
            gray[1],
            gray[2]
        );

        doc.text(
            `${remainingDays} days remaining`,
            margin + 17,
            y + 16
        );


        // VALIDITY INFO RIGHT

        doc.text(
            `Validity: ${validityDays} days`,
            pageWidth - margin - 5,
            y + 9,
            {
                align: "right"
            }
        );


        doc.text(
            `Age: ${ageDays} days`,
            pageWidth - margin - 5,
            y + 15,
            {
                align: "right"
            }
        );


        // ========================================
        // FOOTER
        // ========================================

        doc.setDrawColor(
            border[0],
            border[1],
            border[2]
        );

        doc.line(
            margin,
            pageHeight - 20,
            pageWidth - margin,
            pageHeight - 20
        );


        doc.setFont(
            "helvetica",
            "normal"
        );

        doc.setFontSize(
            7
        );

        doc.setTextColor(
            gray[0],
            gray[1],
            gray[2]
        );


        const generatedDate =
            new Date();


        doc.text(
            `Generated ${generatedDate.toLocaleString(
                "id-ID"
            )}`,
            margin,
            pageHeight - 12
        );


        doc.text(
            "Economic Passport",
            pageWidth / 2,
            pageHeight - 12,
            {
                align: "center"
            }
        );


        doc.text(
            "Official Business Report",
            pageWidth - margin,
            pageHeight - 12,
            {
                align: "right"
            }
        );


        // ========================================
        // DOWNLOAD
        // ========================================

        doc.save(
            `economic-passport-${passportNumber}.pdf`
        );


        exportMessage.style.color =
            "#16a34a";

        exportMessage.textContent =
            "Passport berhasil diekspor sebagai PDF.";


    }

    catch (error) {

        console.error(
            "EXPORT PDF ERROR:",
            error
        );


        exportMessage.style.color =
            "#dc2626";

        exportMessage.textContent =
            error.message ||
            "Gagal membuat PDF.";

    }

    finally {

        exportButton.disabled =
            false;

        exportButton.textContent =
            "Export Passport";

    }

}


// ========================================
// BACK
// ========================================

backButton.addEventListener(
    "click",
    function () {

        window.location.href =
            `final-summary.html?business_id=${encodeURIComponent(
                businessId
            )}`;

    }
);


errorBackButton.addEventListener(
    "click",
    function () {

        window.location.href =
            `final-summary.html?business_id=${encodeURIComponent(
                businessId
            )}`;

    }
);


// ========================================
// RETRY
// ========================================

retryButton.addEventListener(
    "click",
    function () {

        loadPassportData();

    }
);


// ========================================
// LOGOUT
// ========================================

logoutButton.addEventListener(
    "click",
    function () {

        localStorage.removeItem(
            "token"
        );

        localStorage.removeItem(
            "access_token"
        );

        localStorage.removeItem(
            "user"
        );

        localStorage.removeItem(
            "selected_business_id"
        );

        localStorage.removeItem(
            "last_business_id"
        );

        window.location.href =
            "index.html";

    }
);


// ========================================
// UI STATE
// ========================================

function showLoading() {

    loadingState.classList.remove(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );

}


function showContent() {

    loadingState.classList.add(
        "hidden"
    );

    errorState.classList.add(
        "hidden"
    );

    content.classList.remove(
        "hidden"
    );

}


function showError(
    message
) {

    loadingState.classList.add(
        "hidden"
    );

    content.classList.add(
        "hidden"
    );

    errorState.classList.remove(
        "hidden"
    );


    errorMessage.textContent =
        message;

}