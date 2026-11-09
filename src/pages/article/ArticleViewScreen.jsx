import { useParams, useNavigate } from "react-router";
import { useState, useEffect } from "react";
import Card from "../../components/cards/Card";
import Badge from "../../components/badges/Badge";
import ButtonPrimary from "../../components/buttons/ButtonPrimary";
import ButtonSecondary from "../../components/buttons/ButtonSecondary";
import { useFetch } from "../../hooks/useFetch";
import HandlerApp from "../../utils/HandlerApp";

const ArticleViewScreen = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const api = useFetch();
    const handlerApp = HandlerApp();

    const [article, setArticle] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchArticle = async () => {
            setLoading(true);
            handlerApp.setLoader(true);
            try {
                const res = await api.get(`article/${id}`);
                if (res.data) {
                    setArticle(res.data);
                } else {
                    setError("No se encontró el artículo.");
                }
            } catch (err) {
                console.error("Error al cargar el artículo:", err);
                setError(err.message || "Error al conectar con el servidor.");
            } finally {
                setLoading(false);
                handlerApp.setLoader(false);
            }
        };

        if (id) {
            fetchArticle();
        }
    }, [id]);

    if (loading) {
        return null;
    }

    if (error || !article) {
        return (
            <div className="container-fluid p-3 p-md-4">
                <div className="alert alert-warning shadow-sm d-flex flex-column flex-sm-row align-items-sm-center justify-content-between gap-3" role="alert">
                    <div className="d-flex align-items-center">
                        <i className="bi bi-exclamation-triangle-fill me-2 fs-5"></i>
                        <span>No se encontró ningún artículo con el identificador <strong>#{id}</strong>.</span>
                    </div>
                    <ButtonSecondary label="Volver al Listado" onClick={() => navigate("/article")} />
                </div>
            </div>
        );
    }

    return (
        <div className="container-fluid p-3 p-md-4">
            {/* Header de Navegación y Acciones */}
            <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between mb-4 pb-3 border-bottom gap-3">
                <div className="d-flex align-items-center gap-3 w-100 w-md-auto">
                    <button
                        className="btn btn-outline-secondary btn-sm rounded-circle d-flex align-items-center justify-content-center flex-shrink-0"
                        style={{ width: "38px", height: "38px" }}
                        onClick={() => navigate("/article")}
                        title="Volver"
                    >
                        <i className="bi bi-arrow-left fs-5"></i>
                    </button>
                    <div className="text-truncate">
                        <span className="text-muted small text-uppercase fw-semibold d-block">
                            Detalles del Artículo #{article.article_id}
                        </span>
                        <h3 className="fw-bold mb-0 text-dark text-truncate">{article.article_subject}</h3>
                    </div>
                </div>

                <div className="d-flex align-items-center gap-2 w-100 w-md-auto justify-content-end flex-wrap">
                    <ButtonSecondary
                        label="Volver al Listado"
                        onClick={() => navigate("/article")}
                        className="flex-grow-1 flex-md-grow-0"
                    />
                    <ButtonPrimary
                        label="Editar Artículo"
                        onClick={() => navigate(`/article/edit/${article.article_id}`)}
                        className="flex-grow-1 flex-md-grow-0"
                    />
                </div>
            </div>

            <div className="row g-4">
                {/* Columna Principal: Contenido del artículo */}
                <div className="col-12 col-lg-8">
                    <Card title="Contenido de la Publicación" outline outlineColor="primary">
                        <div className="p-2 p-md-3">
                            {article.article_description && (
                                <div className="alert alert-light border mb-4 shadow-sm">
                                    <h6 className="fw-bold text-dark mb-2 d-flex align-items-center">
                                        <i className="bi bi-quote me-2 text-primary fs-5"></i>
                                        Resumen / Descripción
                                    </h6>
                                    <p className="text-secondary mb-0">
                                        {article.article_description}
                                    </p>
                                </div>
                            )}

                            <h5 className="fw-bold text-dark mb-3">Cuerpo del Artículo</h5>
                            <div className="text-secondary lh-lg" style={{ whiteSpace: "pre-line", fontSize: "1.05rem" }}>
                                {article.article}
                            </div>

                            {article.article_copyright_url && (
                                <div className="mt-4 pt-3 border-top">
                                    <span className="small text-muted d-block mb-1">Licencia / Derechos:</span>
                                    <a
                                        href={article.article_copyright_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="small text-decoration-none d-inline-flex align-items-center gap-1"
                                    >
                                        <i className="bi bi-shield-check"></i>
                                        <span>{article.article_copyright_url}</span>
                                        <i className="bi bi-box-arrow-up-right ms-1"></i>
                                    </a>
                                </div>
                            )}
                        </div>
                    </Card>
                </div>

                {/* Columna Lateral: Metadatos e Información */}
                <div className="col-12 col-lg-4">
                    <Card title="Metadatos y Registro" outline outlineColor="info">
                        <ul className="list-group list-group-flush">
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                <span className="text-muted fw-semibold">Estado:</span>
                                <Badge
                                    type={article.article_active ? "Success" : "Secondary"}
                                    text={article.article_active ? "Activo" : "Inactivo"}
                                    pill
                                />
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                <span className="text-muted fw-semibold">Tópico ID:</span>
                                <span className="badge bg-light text-dark border">#{article.topic_id}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                <span className="text-muted fw-semibold">Fecha del Artículo:</span>
                                <span className="text-dark fw-medium">{article.article_date || "—"}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                <span className="text-muted fw-semibold">Creado por (User ID):</span>
                                <span className="text-dark">#{article.article_created_by}</span>
                            </li>
                            <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                <span className="text-muted fw-semibold">Fecha de Creación:</span>
                                <span className="text-muted small">
                                    {article.article_created_at ? article.article_created_at.split("T")[0] : "—"}
                                </span>
                            </li>
                            {article.article_updated_at && (
                                <li className="list-group-item d-flex justify-content-between align-items-center px-0 py-3">
                                    <span className="text-muted fw-semibold">Última Actualización:</span>
                                    <span className="text-muted small">
                                        {article.article_updated_at.split("T")[0]}
                                    </span>
                                </li>
                            )}
                        </ul>

                        <div className="mt-4 pt-3 border-top">
                            <small className="text-muted d-block mb-2 fw-semibold">Acciones Rápidas:</small>
                            <div className="d-grid gap-2">
                                <button
                                    className="btn btn-outline-primary btn-sm d-flex align-items-center justify-content-center gap-2 py-2"
                                    onClick={() => navigate(`/article/edit/${article.article_id}`)}
                                >
                                    <i className="bi bi-pencil-square"></i>
                                    <span>Modificar Información</span>
                                </button>
                                <button
                                    className="btn btn-outline-secondary btn-sm d-flex align-items-center justify-content-center gap-2 py-2"
                                    onClick={() => window.print()}
                                >
                                    <i className="bi bi-printer"></i>
                                    <span>Imprimir / Exportar Ficha</span>
                                </button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default ArticleViewScreen;
