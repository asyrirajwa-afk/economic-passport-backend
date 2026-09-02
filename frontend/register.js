const API_URL =
    "http://127.0.0.1:8000";


// ========================================
// AMBIL ELEMENT HTML
// ========================================

const fullNameInput =
    document.getElementById("fullName");

const emailInput =
    document.getElementById("email");

const phoneInput =
    document.getElementById("phone");

const passwordInput =
    document.getElementById("password");

const confirmPasswordInput =
    document.getElementById(
        "confirmPassword"
    );

const registerButton =
    document.getElementById(
        "registerButton"
    );

const message =
    document.getElementById("message");


// ========================================
// TOGGLE PASSWORD
// ========================================

const togglePassword =
    document.getElementById(
        "togglePassword"
    );

const eyeOffIcon =
    document.getElementById(
        "eyeOffIcon"
    );

const eyeIcon =
    document.getElementById(
        "eyeIcon"
    );


togglePassword.addEventListener(
    "click",
    function () {

        if (
            passwordInput.type ===
            "password"
        ) {

            // PASSWORD TERLIHAT

            passwordInput.type =
                "text";

            eyeOffIcon.style.display =
                "none";

            eyeIcon.style.display =
                "block";

            togglePassword.setAttribute(
                "aria-label",
                "Sembunyikan password"
            );

        } else {

            // PASSWORD TERSEMBUNYI

            passwordInput.type =
                "password";

            eyeOffIcon.style.display =
                "block";

            eyeIcon.style.display =
                "none";

            togglePassword.setAttribute(
                "aria-label",
                "Tampilkan password"
            );
        }
    }
);


// ========================================
// TOGGLE CONFIRM PASSWORD
// ========================================

const toggleConfirmPassword =
    document.getElementById(
        "toggleConfirmPassword"
    );

const confirmEyeOffIcon =
    document.getElementById(
        "confirmEyeOffIcon"
    );

const confirmEyeIcon =
    document.getElementById(
        "confirmEyeIcon"
    );


toggleConfirmPassword.addEventListener(
    "click",
    function () {

        if (
            confirmPasswordInput.type ===
            "password"
        ) {

            // PASSWORD TERLIHAT

            confirmPasswordInput.type =
                "text";

            confirmEyeOffIcon.style.display =
                "none";

            confirmEyeIcon.style.display =
                "block";

            toggleConfirmPassword.setAttribute(
                "aria-label",
                "Sembunyikan password"
            );

        } else {

            // PASSWORD TERSEMBUNYI

            confirmPasswordInput.type =
                "password";

            confirmEyeOffIcon.style.display =
                "block";

            confirmEyeIcon.style.display =
                "none";

            toggleConfirmPassword.setAttribute(
                "aria-label",
                "Tampilkan password"
            );
        }
    }
);


// ========================================
// REGISTER
// ========================================

registerButton.addEventListener(
    "click",
    async function () {

        // Bersihkan pesan sebelumnya

        message.textContent = "";

        message.style.color =
            "#dc2626";


        // =================================
        // AMBIL DATA
        // =================================

        const fullName =
            fullNameInput.value.trim();

        const email =
            emailInput.value.trim();

        const phone =
            phoneInput.value.trim();

        const password =
            passwordInput.value;

        const confirmPassword =
            confirmPasswordInput.value;


        // =================================
        // VALIDASI NAMA
        // =================================

        if (!fullName) {

            message.textContent =
                "Nama lengkap wajib diisi.";

            fullNameInput.focus();

            return;
        }


        // =================================
        // VALIDASI EMAIL
        // =================================

        if (!email) {

            message.textContent =
                "Email wajib diisi.";

            emailInput.focus();

            return;
        }


        // =================================
        // VALIDASI FORMAT EMAIL
        // =================================

        const emailPattern =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/;


        if (
            !emailPattern.test(email)
        ) {

            message.textContent =
                "Format email tidak valid.";

            emailInput.focus();

            return;
        }


        // =================================
        // VALIDASI PHONE
        // =================================

        if (!phone) {

            message.textContent =
                "Nomor telepon wajib diisi.";

            phoneInput.focus();

            return;
        }


        // =================================
        // VALIDASI PASSWORD
        // =================================

        if (!password) {

            message.textContent =
                "Password wajib diisi.";

            passwordInput.focus();

            return;
        }


        // =================================
        // VALIDASI KONFIRMASI PASSWORD
        // =================================

        if (!confirmPassword) {

            message.textContent =
                "Konfirmasi password wajib diisi.";

            confirmPasswordInput.focus();

            return;
        }


        // =================================
        // CEK PASSWORD
        // =================================

        if (
            password !==
            confirmPassword
        ) {

            message.textContent =
                "Password dan konfirmasi password tidak sama.";

            confirmPasswordInput.focus();

            return;
        }


        // =================================
        // DISABLE BUTTON
        // =================================

        registerButton.disabled =
            true;

        registerButton.textContent =
            "Mendaftarkan...";


        try {

            // =================================
            // REQUEST REGISTER
            // =================================

            const response =
                await fetch(
                    `${API_URL}/auth/register`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type":
                                "application/json"
                        },

                        body: JSON.stringify({

                            email: email,

                            password: password,

                            full_name:
                                fullName,

                            phone: phone

                        })
                    }
                );


            // =================================
            // BACA RESPONSE
            // =================================

            const data =
                await response.json();


            console.log(
                "RESPONSE REGISTER:",
                data
            );


            // =================================
            // REGISTER GAGAL
            // =================================

            if (!response.ok) {

                if (
                    Array.isArray(
                        data.detail
                    )
                ) {

                    message.textContent =
                        data.detail
                            .map(
                                error =>
                                    error.msg
                            )
                            .join(", ");

                } else {

                    message.textContent =
                        data.detail ||
                        "Registrasi gagal.";

                }


                registerButton.disabled =
                    false;

                registerButton.textContent =
                    "Daftar";

                return;
            }


            // =================================
            // REGISTER BERHASIL
            // =================================

            message.style.color =
                "#16a34a";

            message.textContent =
                "Registrasi berhasil. Mengarahkan ke halaman login...";


            // =================================
            // PINDAH KE LOGIN
            // =================================

            setTimeout(
                function () {

                    window.location.href =
                        "index.html";

                },
                1200
            );

        }


        // =================================
        // ERROR CONNECTION
        // =================================

        catch (error) {

            console.error(
                "ERROR REGISTER:",
                error
            );


            message.textContent =
                "Tidak dapat terhubung ke server.";


            registerButton.disabled =
                false;

            registerButton.textContent =
                "Daftar";
        }

    }
);