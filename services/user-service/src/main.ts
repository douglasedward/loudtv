import { NestFactory } from "@nestjs/core";
import { ValidationPipe, VersioningType } from "@nestjs/common";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { ConfigService } from "@nestjs/config";
import helmet from "helmet";
import compression from "compression";
import { AppModule } from "./app.module";
import { HttpExceptionFilter } from "./common/filters/http-exception.filter";
import { LoggingInterceptor } from "./common/interceptors/logging.interceptor";
import { TransformInterceptor } from "./common/interceptors/transform.interceptor";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const configService = app.get(ConfigService);
  const port = configService.get<number>("PORT", 3001);
  const apiPrefix = configService.get<string>("API_PREFIX", "api/v1");
  const swaggerEnabled = configService.get<boolean>("SWAGGER_ENABLED", true);

  // Security middleware
  app.use(helmet());
  app.use(compression());

  // Enable CORS for development
  app.enableCors({
    origin: process.env.NODE_ENV === "development" ? true : false,
    credentials: true,
  });

  // Global prefix
  app.setGlobalPrefix(apiPrefix);

  // API Versioning
  app.enableVersioning({
    type: VersioningType.URI,
  });

  // Global validation pipe, filters and interceptors
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(
    new LoggingInterceptor(),
    new TransformInterceptor(),
  );

  // Swagger documentation
  if (swaggerEnabled) {
    const config = new DocumentBuilder()
      .setTitle("User Service API")
      .setDescription(
        "User management microservice for live streaming platform",
      )
      .setVersion("1.0")
      .addBearerAuth(
        {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          name: "JWT",
          description: "Enter JWT token",
          in: "header",
        },
        "JWT-auth",
      )
      .addTag("auth", "Authentication endpoints")
      .addTag("users", "User management endpoints")
      .addTag("followers", "Social features endpoints")
      .addTag("health", "Health check endpoints")
      .addTag("metrics", "Monitoring and metrics endpoints")
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup(`${apiPrefix}/docs`, app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  // Graceful shutdown
  process.on("SIGINT", () => {
    console.log("Received SIGINT, shutting down gracefully...");
    app
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });

  process.on("SIGTERM", () => {
    console.log("Received SIGTERM, shutting down gracefully...");
    app
      .close()
      .then(() => process.exit(0))
      .catch(() => process.exit(1));
  });

  await app.listen(port);
  console.log(`🚀 User Service running on port ${port}`);
  console.log(
    `📚 API Documentation: http://localhost:${port}/${apiPrefix}/docs`,
  );
}

bootstrap().catch((error) => {
  console.error("Error starting the application:", error);
  process.exit(1);
});
