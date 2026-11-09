import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router";
import ReCAPTCHA from "react-google-recaptcha";
import InputEmail from "../../components/inputs/InputEmail";
import InputPassword from "../../components/inputs/InputPassword";
import ButtonPrimary from "../../components/buttons/ButtonPrimary";
import HandlerApp from "../../utils/HandlerApp";
import { login } from "../../api/auth";

const LoginScreen = () => {
    const nav = useNavigate();
    const handlerApp = HandlerApp();
    const captchaRef = useRef(null);
    const [captchaToken, setCaptchaToken] = useState("");
    const [submitError, setSubmitError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const captchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

    const { control, handleSubmit, formState: { errors }, setError } = useForm({
        mode: "onBlur",
    });
    
    const submitData = async (data) => {
        if (!captchaSiteKey) {
            setSubmitError("El CAPTCHA no está configurado. Comunícate con soporte.");
            return;
        }

        if (!captchaToken) {
            setSubmitError("Completa el CAPTCHA para continuar.");
            return;
        }

        setSubmitError("");
        setIsSubmitting(true);
        handlerApp.setLoader(true);
        try {
            await login({
                identifier: data.email,
                password: data.pass,
                captchaToken,
            });
            nav("/home");
        } catch (error) {
            if (error.status === 401 || error.status === 403) {
                setError("email", { type: "server", message: "Las credenciales no son válidas." });
                setError("pass", { type: "server", message: "Las credenciales no son válidas." });
                setSubmitError("No pudimos iniciar sesión. Revisa tus credenciales.");
            } else if (error.status === 400 || error.status === 503) {
                setSubmitError(error.message);
            } else {
                setSubmitError("No pudimos conectar con el servicio. Inténtalo nuevamente.");
            }
            captchaRef.current?.reset();
            setCaptchaToken("");
        } finally {
            setIsSubmitting(false);
            handlerApp.setLoader(false);
        }
    };
    const submitForm = (event) => {
        void handleSubmit(submitData)(event);
    };

    return (
        <div className="login-page bg-body-secondary">
            <main className="login-box">
                <h1 className="login-logo">
                    {import.meta.env.VITE_PROJECT_NAME || "SIGECI"}
                </h1>
                <div className="card">
                    <div className="card-body login-card-body">
                        <p className="login-box-msg">Inicia sesión para comenzar</p>

                        <form onSubmit={submitForm} noValidate>
                            <InputEmail
                                control={control}
                                label="Correo electrónico"
                                name="email"
                                errors={errors.email}
                                required={true}
                            />
                            {errors.email?.type === "server" && (
                                <p className="small text-danger mt-1" role="alert">{errors.email.message}</p>
                            )}
                            <InputPassword
                                control={control}
                                label="Contraseña"
                                name="pass"
                                placeholder="Contraseña"
                                errors={errors.pass}
                                required={true}
                            />
                            {errors.pass?.type === "server" && (
                                <p className="small text-danger mt-1" role="alert">{errors.pass.message}</p>
                            )}

                            <div className="mb-3" aria-describedby="captcha-error">
                                {captchaSiteKey ? (
                                    <ReCAPTCHA
                                        ref={captchaRef}
                                        sitekey={captchaSiteKey}
                                        onChange={(token) => {
                                            setCaptchaToken(token || "");
                                            setSubmitError("");
                                        }}
                                        onExpired={() => setCaptchaToken("")}
                                        onErrored={() => {
                                            setCaptchaToken("");
                                            setSubmitError("No pudimos cargar el CAPTCHA. Inténtalo nuevamente.");
                                        }}
                                    />
                                ) : (
                                    <p className="small text-danger mb-0" role="alert">
                                        El CAPTCHA no está configurado. Comunícate con soporte.
                                    </p>
                                )}
                                {!captchaToken && submitError === "Completa el CAPTCHA para continuar." && (
                                    <p id="captcha-error" className="small text-danger mt-1 mb-0" role="alert">
                                        Completa el CAPTCHA antes de enviar.
                                    </p>
                                )}
                            </div>
                            {submitError && submitError !== "Completa el CAPTCHA para continuar." && (
                                <div className="alert alert-danger" role="alert">{submitError}</div>
                            )}

                            <div className="row mb-3">
                                <div className="col-8">
                                    <div className="form-check">
                                        <input className="form-check-input" type="checkbox" value="" id="flexCheckDefault" />
                                        <label className="form-check-label" htmlFor="flexCheckDefault">
                                            Recuérdame
                                        </label>
                                    </div>
                                </div>
                            </div>
                            <ButtonPrimary
                                label={isSubmitting ? "Iniciando sesión..." : "Iniciar sesión"}
                                className="w-100"
                                type="submit"
                                disabled={isSubmitting}
                            />
                        </form>

                        <div className="social-auth-links text-center d-grid gap-2">
                            <button type="button" className="btn btn-danger" disabled>
                                <i className="bi bi-google me-2"></i>Iniciar sesión con Google
                            </button>
                        </div>

                        <p className="mb-1">
                            <a href="/forgot-password">¿Olvidaste tu contraseña?</a>
                        </p>
                        <p className="mb-0">
                            <a href="/register" className="text-center">
                                Registrar nueva cuenta
                            </a>
                        </p>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default LoginScreen;