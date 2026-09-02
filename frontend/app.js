console.log("APP.JS BERHASIL DIMUAT");


const API_URL = "https://economic-passport-backend-production.up.railway.app";


// ========================================
// AMBIL ELEMENT HTML
// ========================================

const loginButton =
    document.getElementById("loginButton");

const emailInput =
    document.getElementById("email");

const passwordInput =
    document.getElementById("password");

const togglePassword =
    document.getElementById("togglePassword");

const errorMessage =
    document.getElementById("errorMessage");


// ========================================
// CEK ELEMENT
// ========================================

console.log(
    "LOGIN BUTTON:",
    loginButton
);

console.log(
    "EMAIL INPUT:",
    emailInput
);

console.log(
    "PASSWORD INPUT:",
    passwordInput
);

console.log(
    "TOGGLE PASSWORD:",
    togglePassword
);


// ========================================
// IZINKAN USER MENGISI EMAIL
// ========================================

emailInput.addEventListener(
    "focus",
    function () {

        this.removeAttribute("readonly");

    }
);


// ========================================
// IZINKAN USER MENGISI PASSWORD
// ========================================

passwordInput.addEventListener(
    "focus",
    function () {

        this.removeAttribute("readonly");

    }
);


// ========================================
// BUKA / TUTUP PASSWORD
// ========================================

// ========================================
// BUKA / TUTUP PASSWORD
// ========================================

const eyeOffIcon =
    document.getElementById("eyeOffIcon");

const eyeIcon =
    document.getElementById("eyeIcon");


togglePassword.addEventListener(
    "click",
    function () {

        console.log("TOMBOL MATA DIKLIK");

        if (passwordInput.type === "password") {

            // ==============================
            // BUKA PASSWORD
            // ==============================

            passwordInput.type = "text";

            eyeOffIcon.style.display = "none";
            eyeIcon.style.display = "block";

            togglePassword.setAttribute(
                "aria-label",
                "Sembunyikan password"
            );

        } else {

            // ==============================
            // TUTUP PASSWORD
            // ==============================

            passwordInput.type = "password";

            eyeOffIcon.style.display = "block";
            eyeIcon.style.display = "none";

            togglePassword.setAttribute(
                "aria-label",
                "Tampilkan password"
            );

        }

    }
);


// ========================================
// LOGIN
// ========================================

loginButton.addEventListener(
    "click",
    async function () {

        console.log(
            "TOMBOL LOGIN DIKLIK"
        );


        // Ambil input

        const email =
            emailInput.value.trim();

        const password =
            passwordInput.value;


        console.log(
            "EMAIL:",
            email
        );

        console.log(
            "PASSWORD TERISI:",
            password.length > 0
        );


        // Bersihkan error

        errorMessage.textContent =
            "";


        // =================================
        // VALIDASI
        // =================================

        if (!email) {

            errorMessage.textContent =
                "Email wajib diisi.";

            emailInput.focus();

            return;
        }


        if (!password) {

            errorMessage.textContent =
                "Password wajib diisi.";

            passwordInput.focus();

            return;
        }


        console.log(
            "MENGIRIM REQUEST LOGIN..."
        );


        // =================================
        // MATIKAN BUTTON SEMENTARA
        // =================================

        loginButton.disabled = true;

        loginButton.textContent =
            "Memproses...";


        try {

            // =================================
            // BUAT URL LOGIN
            // =================================

            const url =
                `${API_URL}/auth/login` +
                `?email=${encodeURIComponent(email)}` +
                `&password=${encodeURIComponent(password)}`;


            console.log(
                "REQUEST LOGIN DIKIRIM"
            );


            // =================================
            // REQUEST KE FASTAPI
            // =================================

            const response =
                await fetch(
                    url,
                    {
                        method: "POST"
                    }
                );


            console.log(
                "STATUS LOGIN:",
                response.status
            );


            // =================================
            // BACA RESPONSE
            // =================================

            const data =
                await response.json();


            console.log(
                "RESPONSE LOGIN:",
                data
            );


            // =================================
            // JIKA LOGIN GAGAL
            // =================================

            if (!response.ok) {

                console.log(
                    "LOGIN GAGAL"
                );


                if (
                    Array.isArray(
                        data.detail
                    )
                ) {

                    errorMessage.textContent =
                        data.detail
                            .map(
                                error =>
                                    error.msg
                            )
                            .join(", ");

                } else {

                    errorMessage.textContent =
                        data.detail ||
                        "Email atau password salah.";

                }


                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Login";

                return;
            }


            // =================================
            // PASTIKAN TOKEN ADA
            // =================================

            if (
                !data.access_token
            ) {

                console.error(
                    "ACCESS TOKEN TIDAK ADA:",
                    data
                );


                errorMessage.textContent =
                    "Token login tidak ditemukan.";


                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Login";

                return;
            }


            console.log(
                "LOGIN API BERHASIL"
            );

            console.log(
                "ACCESS TOKEN ADA"
            );


            // =================================
            // SIMPAN TOKEN
            // =================================

            localStorage.setItem(
                "token",
                data.access_token
            );


            // =================================
            // SIMPAN DATA USER
            // =================================

            if (data.user) {

                localStorage.setItem(
                    "user",
                    JSON.stringify(
                        data.user
                    )
                );

            }


            // =================================
            // DEBUG
            // =================================

            console.log(
                "TOKEN DI LOCALSTORAGE:",
                localStorage.getItem(
                    "token"
                )
                    ? "ADA"
                    : "TIDAK ADA"
            );


            console.log(
                "USER DI LOCALSTORAGE:",
                localStorage.getItem(
                    "user"
                )
                    ? "ADA"
                    : "TIDAK ADA"
            );


            localStorage.setItem(
                "login_debug",
                "TOKEN BERHASIL DISIMPAN"
            );


            // =================================
            // PASTIKAN TOKEN TERSIMPAN
            // =================================

            if (
                !localStorage.getItem(
                    "token"
                )
            ) {

                console.error(
                    "TOKEN GAGAL DISIMPAN"
                );


                errorMessage.textContent =
                    "Token gagal disimpan.";


                loginButton.disabled =
                    false;

                loginButton.textContent =
                    "Login";

                return;
            }


            console.log(
                "LOGIN BERHASIL"
            );


            // =================================
            // MASUK DASHBOARD
            // =================================

            console.log(
                "PINDAH KE DASHBOARD..."
            );


            window.location.href =
                "dashboard.html";

        }


        catch (error) {

            console.error(
                "ERROR LOGIN:",
                error
            );


            errorMessage.textContent =
                "Tidak dapat terhubung ke server.";


            loginButton.disabled =
                false;

            loginButton.textContent =
                "Login";

        }

    }
);