from flask import Flask
from config import Config
from app.extensions import db, migrate, jwt, cors


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    cors.init_app(app, resources={r"/api/*": {"origins": app.config["FRONTEND_ORIGIN"]}})

    # Import models so Flask-Migrate can detect them
    from app.models import user, chat, message, survey  # noqa: F401

    from app.routes.auth_routes import auth_bp
    from app.routes.chat_routes import chat_bp
    from app.routes.admin_routes import admin_bp
    from app.routes.survey_routes import survey_bp

    app.register_blueprint(auth_bp, url_prefix="/api/auth")
    app.register_blueprint(chat_bp, url_prefix="/api/chat")
    app.register_blueprint(admin_bp, url_prefix="/api/admin")
    app.register_blueprint(survey_bp, url_prefix="/api/survey")

    @app.route("/api/health")
    def health():
        return {"status": "ok"}

    return app
