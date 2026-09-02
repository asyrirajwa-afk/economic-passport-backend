console.log("=================================");
console.log("ADD-BUSINESS.JS BERHASIL DIMUAT");
console.log("=================================");


/* ==================================================
   CONFIG
================================================== */

const API_URL = "http://127.0.0.1:8000";


/* ==================================================
   TOKEN
================================================== */

const token =
    localStorage.getItem("token");


console.log(
    "TOKEN:",
    token ? "ADA" : "TIDAK ADA"
);


/* ==================================================
   CEK LOGIN
================================================== */

if (!token) {

    console.error(
        "TOKEN TIDAK DITEMUKAN"
    );

    window.location.href =
        "index.html";

}


/* ==================================================
   AMBIL ELEMENT
================================================== */

const businessForm =
    document.getElementById(
        "businessForm"
    );


const saveButton =
    document.getElementById(
        "saveButton"
    );


const errorMessage =
    document.getElementById(
        "errorMessage"
    );


const backButton =
    document.getElementById(
        "backButton"
    );


console.log(
    "FORM:",
    businessForm
);


console.log(
    "SAVE BUTTON:",
    saveButton
);


console.log(
    "ERROR MESSAGE:",
    errorMessage
);


console.log(
    "BACK BUTTON:",
    backButton
);


/* ==================================================
   CEK ELEMENT
================================================== */

if (!businessForm) {

    console.error(
        "ERROR: businessForm TIDAK DITEMUKAN"
    );

}


if (!saveButton) {

    console.error(
        "ERROR: saveButton TIDAK DITEMUKAN"
    );

}


/* ==================================================
   TOMBOL KEMBALI
================================================== */

if (backButton) {

    backButton.addEventListener(
        "click",
        function (event) {

            event.preventDefault();

            console.log(
                "TOMBOL KEMBALI DIKLIK"
            );

            window.location.href =
                "dashboard.html";

        }
    );

}


/* ==================================================
   SUBMIT FORM
================================================== */

if (businessForm) {

    businessForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();
            event.stopPropagation();


            console.log("");
            console.log(
                "================================="
            );
            console.log(
                "TOMBOL SIMPAN BISNIS DIKLIK"
            );
            console.log(
                "================================="
            );


            /* ==========================================
               AMBIL INPUT
            ========================================== */

            const businessNameElement =
                document.getElementById(
                    "businessName"
                );


            const businessCategoryElement =
                document.getElementById(
                    "businessCategory"
                );


            const businessSizeElement =
                document.getElementById(
                    "businessSize"
                );


            const productCategoryElement =
                document.getElementById(
                    "productCategory"
                );


            const primaryMarketplaceElement =
                document.getElementById(
                    "primaryMarketplace"
                );


            const sellerCityElement =
                document.getElementById(
                    "sellerCity"
                );


            /* ==========================================
               CEK INPUT
            ========================================== */

            if (
                !businessNameElement ||
                !businessCategoryElement ||
                !businessSizeElement ||
                !productCategoryElement ||
                !primaryMarketplaceElement ||
                !sellerCityElement
            ) {

                console.error(
                    "ADA ELEMENT INPUT YANG TIDAK DITEMUKAN"
                );


                if (errorMessage) {

                    errorMessage.textContent =
                        "Form tidak lengkap. Periksa kembali HTML.";

                }


                return;

            }


            /* ==========================================
               AMBIL VALUE
            ========================================== */

            const businessName =
                businessNameElement.value.trim();


            const businessCategory =
                businessCategoryElement.value;


            const businessSize =
                businessSizeElement.value;


            const productCategory =
                productCategoryElement.value.trim();


            const primaryMarketplace =
                primaryMarketplaceElement.value;


            const sellerCity =
                sellerCityElement.value.trim();


            /* ==========================================
               DEBUG
            ========================================== */

            console.log(
                "NAMA BISNIS:",
                businessName
            );


            console.log(
                "KATEGORI BISNIS:",
                businessCategory
            );


            console.log(
                "SKALA BISNIS:",
                businessSize
            );


            console.log(
                "KATEGORI PRODUK:",
                productCategory
            );


            console.log(
                "MARKETPLACE:",
                primaryMarketplace
            );


            console.log(
                "KOTA:",
                sellerCity
            );


            /* ==========================================
               RESET ERROR
            ========================================== */

            if (errorMessage) {

                errorMessage.textContent =
                    "";

                errorMessage.style.color =
                    "#dc2626";

            }


            /* ==========================================
               VALIDASI
            ========================================== */

            if (
                !businessName ||
                !businessCategory ||
                !businessSize ||
                !productCategory ||
                !primaryMarketplace ||
                !sellerCity
            ) {

                console.error(
                    "VALIDASI GAGAL"
                );


                if (errorMessage) {

                    errorMessage.textContent =
                        "Semua field wajib diisi.";

                }


                return;

            }


            console.log(
                "VALIDASI FORM: BERHASIL"
            );


            /* ==========================================
               DATA
            ========================================== */

            const businessData = {

                business_name:
                    businessName,

                business_category:
                    businessCategory,

                business_size:
                    businessSize,

                product_category:
                    productCategory,

                primary_marketplace:
                    primaryMarketplace,

                seller_city:
                    sellerCity

            };


            console.log(
                "DATA YANG AKAN DIKIRIM:"
            );


            console.log(
                businessData
            );


            /* ==========================================
               BUTTON LOADING
            ========================================== */

            saveButton.disabled =
                true;


            saveButton.textContent =
                "Menyimpan...";


            /* ==========================================
               REQUEST
            ========================================== */

            try {

                console.log(
                    "MENGIRIM POST /businesses..."
                );


                const response =
                    await fetch(
                        `${API_URL}/businesses`,
                        {

                            method:
                                "POST",

                            headers: {

                                "Content-Type":
                                    "application/json",

                                "Authorization":
                                    `Bearer ${token}`

                            },

                            body:
                                JSON.stringify(
                                    businessData
                                )

                        }
                    );


                console.log(
                    "STATUS CREATE BUSINESS:",
                    response.status
                );


                console.log(
                    "RESPONSE OK:",
                    response.ok
                );


                /* ======================================
                   RESPONSE
                ====================================== */

                let data = null;


                try {

                    data =
                        await response.json();

                }

                catch (jsonError) {

                    console.error(
                        "RESPONSE BUKAN JSON:",
                        jsonError
                    );

                }


                console.log(
                    "RESPONSE BUSINESS:",
                    data
                );


                /* ======================================
                   ERROR
                ====================================== */

                if (!response.ok) {

                    console.error(
                        "CREATE BUSINESS GAGAL"
                    );


                    let message =
                        "Gagal menyimpan bisnis.";


                    if (data) {

                        if (
                            Array.isArray(
                                data.detail
                            )
                        ) {

                            message =
                                data.detail
                                    .map(
                                        error =>
                                            error.msg
                                    )
                                    .join(
                                        ", "
                                    );

                        }

                        else if (
                            data.detail
                        ) {

                            message =
                                data.detail;

                        }

                        else if (
                            data.message
                        ) {

                            message =
                                data.message;

                        }

                    }


                    if (errorMessage) {

                        errorMessage.textContent =
                            message;

                    }


                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        "Simpan Bisnis";


                    return;

                }


                /* ======================================
                   AMBIL BUSINESS ID
                ====================================== */

                const newBusinessId =
                    data?.id ||
                    data?.business?.id;


                console.log(
                    "BUSINESS ID BARU:",
                    newBusinessId
                );


                if (!newBusinessId) {

                    console.error(
                        "BUSINESS ID TIDAK DITEMUKAN"
                    );


                    if (errorMessage) {

                        errorMessage.textContent =
                            "Bisnis berhasil disimpan, tetapi ID bisnis tidak ditemukan.";

                    }


                    saveButton.disabled =
                        false;


                    saveButton.textContent =
                        "Simpan Bisnis";


                    return;

                }


                /* ======================================
                   SIMPAN BUSINESS ID
                ====================================== */

                localStorage.setItem(
                    "selected_business_id",
                    String(
                        newBusinessId
                    )
                );


                localStorage.setItem(
                    "last_business_id",
                    String(
                        newBusinessId
                    )
                );


                console.log(
                    "SELECTED BUSINESS ID:",
                    newBusinessId
                );


                console.log(
                    "LAST BUSINESS ID:",
                    newBusinessId
                );


                /* ======================================
                   BERHASIL
                ====================================== */

                console.log(
                    "================================="
                );


                console.log(
                    "BISNIS BERHASIL DISIMPAN"
                );


                console.log(
                    "BUSINESS ID:",
                    newBusinessId
                );


                console.log(
                    "================================="
                );


                if (errorMessage) {

                    errorMessage.style.color =
                        "#16a34a";

                    errorMessage.textContent =
                        "Bisnis berhasil disimpan.";

                }


                saveButton.textContent =
                    "Berhasil Disimpan";


                /* ======================================
                   REDIRECT
                ====================================== */

                setTimeout(
                    function () {

                        window.location.href =
                            `dashboard.html?business_id=${newBusinessId}`;

                    },
                    700
                );

            }


            catch (error) {

                console.error(
                    "ERROR CREATE BUSINESS:",
                    error
                );


                if (errorMessage) {

                    errorMessage.style.color =
                        "#dc2626";

                    errorMessage.textContent =
                        "Tidak dapat terhubung ke server.";

                }


                saveButton.disabled =
                    false;


                saveButton.textContent =
                    "Simpan Bisnis";

            }

        }
    );

}