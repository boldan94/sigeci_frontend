import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router";
import DataTable from "react-data-table-component";
import Card from "../../components/cards/Card";
import Badge from "../../components/badges/Badge";
import Modal from "../../components/modals/Modal";
import ButtonPrimary from "../../components/buttons/ButtonPrimary";
import ButtonSecondary from "../../components/buttons/ButtonSecondary";
import ButtonLink from "../../components/buttons/ButtonLink";
import { useFetch } from "../../hooks/useFetch";
import HandlerApp from "../../utils/HandlerApp";

const ArticleScreen = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const api = useFetch();
    const handlerApp = HandlerApp();

    const [articles, setArticles] = useState([]);
    const [loading, setLoading] = useState(true);

    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("TODOS");

    const loadArticles = async () => {
        setLoading(true);
        handlerApp.setLoader(true);
        try {
            const res = await api.get("article");
            if (res.data) setArticles(res.data);
        } catch {
            setArticles([]);
            triggerAlert("danger", "No pudimos cargar los artículos desde el servidor.", "Error");
        } finally {
            setLoading(false);
            handlerApp.setLoader(false);
        }
    };

    useEffect(() => {
        loadArticles();
    }, []);

    // Modal de confirmación para eliminar
    const [selectedArticle, setSelectedArticle] = useState(null);
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);

    // Mensaje de alerta / feedback AdminLTE
    const [alertNotification, setAlertNotification] = useState(() => {
        if (location.state?.message) {
            return {
                type: location.state.type || "success",
                title: location.state.title || "Operación exitosa",
                message: location.state.message
            };
        }
        return null;
    });

    const triggerAlert = (type, message, title = "Operación exitosa") => {
        setAlertNotification({ type, title, message });
        setTimeout(() => {
            setAlertNotification(null);
        }, 4500);
    };

    const handleOpenDelete = (article) => {
        setSelectedArticle(article);
        setDeleteModalOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!selectedArticle) return;
        handlerApp.setLoader(true);
        try {
            await api.deleteMethod(`article/${selectedArticle.article_id}/delete`);
            setArticles(prev => prev.filter(a => a.article_id !== selectedArticle.article_id));
            setDeleteModalOpen(false);
            triggerAlert(
                "danger",
                `El artículo "${selectedArticle.article_subject}" (ID: #${selectedArticle.article_id}) ha sido eliminado con éxito.`,
                "¡Artículo Eliminado!"
            );
        } catch (error) {
            console.error("Error al eliminar artículo:", error);
            triggerAlert("danger", "No fue posible eliminar el artículo.", "Error");
        } finally {
            handlerApp.setLoader(false);
            setSelectedArticle(null);
        }
    };

    const filteredArticles = useMemo(() => {
        return articles.filter(article => {
            const subject = article.article_subject || "";
            const desc = article.article_description || "";
            const matchesSearch =
                subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
                desc.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus =
                statusFilter === "TODOS" ||
                (statusFilter === "ACTIVO" && article.article_active) ||
                (statusFilter === "INACTIVO" && !article.article_active);
            return matchesSearch && matchesStatus;
        });
    }, [articles, searchTerm, statusFilter]);

    const columns = [
        {
            name: "ID",
            selector: row => row.article_id,
            sortable: true,
            width: "80px",
            center: true,
            cell: row => <span className="badge bg-light text-secondary border">#{row.article_id}</span>
        },
        {
            name: "Título del Artículo",
            selector: row => row.article_subject,
            sortable: true,
            cell: row => (
                <div className="py-2 text-truncate" style={{ maxWidth: "100%" }}>
                    <span
                        className="fw-semibold text-primary d-block mb-1 text-truncate"
                        style={{ cursor: "pointer" }}
                        onClick={() => navigate(`/article/${row.article_id}`)}
                        title={row.article_subject}
                    >
                        {row.article_subject}
                    </span>
                    <small className="text-muted d-block text-truncate" title={row.article_description}>
                        {row.article_description}
                    </small>
                </div>
            )
        },
        {
            name: "Tópico ID",
            selector: row => row.topic_id,
            sortable: true,
            width: "120px",
            center: true,
            cell: row => (
                <span className="badge bg-light text-dark border">
                    ID #{row.topic_id}
                </span>
            )
        },
        {
            name: "Fecha",
            selector: row => row.article_date,
            sortable: true,
            width: "140px",
            cell: row => <span className="small text-muted">{row.article_date || "—"}</span>
        },
        {
            name: "Estado",
            selector: row => row.article_active,
            sortable: true,
            width: "120px",
            center: true,
            cell: row => (
                <Badge
                    type={row.article_active ? "Success" : "Secondary"}
                    text={row.article_active ? "Activo" : "Inactivo"}
                    pill
                />
            )
        },
        {
            name: "Acciones",
            width: "230px",
            allowOverflow: true,
            ignoreRowClick: true,
            button: true,
            cell: row => (
                <div className="d-flex align-items-center gap-2 justify-content-end py-1 flex-nowrap">
                    <ButtonSecondary
                        label="Ver"
                        className="btn-sm py-1 px-2 text-nowrap"
                        onClick={() => navigate(`/article/${row.article_id}`)}
                    />
                    <ButtonPrimary
                        label="Editar"
                        className="btn-sm py-1 px-2 text-nowrap"
                        onClick={() => navigate(`/article/edit/${row.article_id}`)}
                    />
                    <ButtonLink
                        label="Eliminar"
                        className="text-danger fw-semibold small text-nowrap px-1"
                        onClick={() => handleOpenDelete(row)}
                    />
                </div>
            )
        }
    ];

    return (
        <div className="container-fluid p-4">
            {/* Alert Banner AdminLTE */}
            {alertNotification && (
                <div
                    className={`alert alert-${alertNotification.type} alert-dismissible fade show shadow-sm border-0 mb-4`}
                    role="alert"
                >
                    <div className="d-flex align-items-center">
                        <i className={`bi fs-4 me-2 ${
                            alertNotification.type === "danger"
                                ? "bi-check-circle-fill"
                                : "bi-info-circle-fill"
                        }`}></i>
                        <div>
                            <strong className="d-block">{alertNotification.title}</strong>
                            <span>{alertNotification.message}</span>
                        </div>
                    </div>
                    <button
                        type="button"
                        className="btn-close"
                        aria-label="Close"
                        onClick={() => setAlertNotification(null)}
                    ></button>
                </div>
            )}

            {/* Cabecera de la sección */}
            <div className="d-flex flex-wrap align-items-center justify-content-between mb-4 pb-2 border-bottom gap-3">
                <div>
                    <h2 className="fw-bold mb-1 d-flex align-items-center gap-2">
                        <i className="bi bi-file-earmark-text-fill text-primary"></i>
                        Gestión de Artículos Científicos
                    </h2>
                    <p className="text-secondary mb-0">
                        Publicaciones académicas, revisiones por pares y documentos de investigación SIGECI.
                    </p>
                </div>
                <div className="d-flex gap-2">
                    <button
                        className="btn btn-primary shadow-sm d-flex align-items-center gap-2"
                        onClick={() => navigate("/article/postulate")}
                    >
                        <i className="bi bi-plus-circle"></i>
                        <span>Nuevo Artículo</span>
                    </button>
                </div>
            </div>

            {/* Tarjetas de Estadísticas rápidas */}
            <div className="row g-3 mb-4">
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 border-start border-primary border-4">
                        <div className="card-body d-flex align-items-center justify-content-between py-3">
                            <div>
                                <span className="text-muted small text-uppercase fw-bold">Total Publicaciones</span>
                                <h3 className="fw-bold mb-0 text-dark">{articles.length}</h3>
                            </div>
                            <div className="bg-primary-subtle p-3 rounded-circle text-primary">
                                <i className="bi bi-journal-bookmark fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 border-start border-success border-4">
                        <div className="card-body d-flex align-items-center justify-content-between py-3">
                            <div>
                                <span className="text-muted small text-uppercase fw-bold">Publicados</span>
                                <h3 className="fw-bold mb-0 text-success">
                                    {articles.filter(a => a.status === "Publicado").length}
                                </h3>
                            </div>
                            <div className="bg-success-subtle p-3 rounded-circle text-success">
                                <i className="bi bi-check2-circle fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 border-start border-warning border-4">
                        <div className="card-body d-flex align-items-center justify-content-between py-3">
                            <div>
                                <span className="text-muted small text-uppercase fw-bold">En Revisión</span>
                                <h3 className="fw-bold mb-0 text-warning">
                                    {articles.filter(a => a.status === "En Revisión").length}
                                </h3>
                            </div>
                            <div className="bg-warning-subtle p-3 rounded-circle text-warning">
                                <i className="bi bi-clock-history fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="col-12 col-sm-6 col-xl-3">
                    <div className="card shadow-sm border-0 border-start border-secondary border-4">
                        <div className="card-body d-flex align-items-center justify-content-between py-3">
                            <div>
                                <span className="text-muted small text-uppercase fw-bold">Borradores</span>
                                <h3 className="fw-bold mb-0 text-secondary">
                                    {articles.filter(a => a.status === "Borrador").length}
                                </h3>
                            </div>
                            <div className="bg-secondary-subtle p-3 rounded-circle text-secondary">
                                <i className="bi bi-pencil fs-4"></i>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenedor Principal de la Tabla */}
            <Card title="Repositorio de Artículos" outline outlineColor="primary">
                {/* Filtros y Buscador */}
                <div className="row g-2 mb-3 align-items-center">
                    <div className="col-12 col-md-6 col-lg-5">
                        <div className="input-group">
                            <span className="input-group-text bg-white border-end-0">
                                <i className="bi bi-search text-muted"></i>
                            </span>
                            <input
                                type="text"
                                className="form-control border-start-0 ps-0"
                                placeholder="Buscar por título, autor o categoría..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            {searchTerm && (
                                <button
                                    className="btn btn-outline-secondary border-start-0"
                                    type="button"
                                    onClick={() => setSearchTerm("")}
                                >
                                    <i className="bi bi-x"></i>
                                </button>
                            )}
                        </div>
                    </div>
                    <div className="col-12 col-md-4 col-lg-3">
                        <select
                            className="form-select"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="TODOS">Todos los estados</option>
                            <option value="Publicado">Publicados</option>
                            <option value="En Revisión">En Revisión</option>
                            <option value="Borrador">Borradores</option>
                        </select>
                    </div>
                    <div className="col-12 col-md-2 col-lg-4 text-md-end text-muted small">
                        Mostrando <strong>{filteredArticles.length}</strong> de <strong>{articles.length}</strong> artículos
                    </div>
                </div>

                {/* Tabla */}
                <div className="border rounded">
                    <DataTable
                        columns={columns}
                        data={filteredArticles}
                        pagination
                        paginationPerPage={5}
                        paginationRowsPerPageOptions={[5, 10, 15, 20]}
                        responsive
                        highlightOnHover
                        noDataComponent={
                            <div className="py-5 text-center text-muted">
                                <i className="bi bi-file-earmark-x fs-1 d-block mb-2 text-secondary opacity-50"></i>
                                <p className="mb-0">No se encontraron artículos con los criterios indicados.</p>
                            </div>
                        }
                    />
                </div>
            </Card>

            {/* MODAL DE CONFIRMACIÓN DE ELIMINACIÓN */}
            <Modal
                show={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                title="Confirmar Eliminación de Artículo"
                size="md"
                footer={
                    <>
                        <ButtonSecondary label="Cancelar" onClick={() => setDeleteModalOpen(false)} />
                        <button
                            type="button"
                            className="btn btn-danger d-flex align-items-center gap-1 shadow-sm"
                            onClick={handleConfirmDelete}
                        >
                            <i className="bi bi-trash-fill"></i>
                            <span>Sí, Eliminar Artículo</span>
                        </button>
                    </>
                }
            >
                {selectedArticle && (
                    <div className="text-center py-3">
                        <div className="text-danger mb-3">
                            <i className="bi bi-exclamation-octagon-fill" style={{ fontSize: "3rem" }}></i>
                        </div>
                        <h5 className="fw-bold text-dark">¿Deseas eliminar este artículo permanentemente?</h5>
                        <p className="text-muted px-2 mb-2">
                            Estás a punto de remover <strong>&quot;{selectedArticle.title}&quot;</strong> de la base de datos de publicaciones.
                        </p>
                        <div className="alert alert-warning py-2 small mb-0">
                            <i className="bi bi-info-circle me-1"></i> Autor: {selectedArticle.author} · Categoría: {selectedArticle.category}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default ArticleScreen;