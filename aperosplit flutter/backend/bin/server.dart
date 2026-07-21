import 'dart:io';
import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:shelf_router/shelf_router.dart';
import 'package:shelf_cors/shelf_cors.dart';
import 'package:dotenv/dotenv.dart';
import 'src/database/database.dart';
import 'src/router/app_router.dart';

void main(List<String> args) async {
  // Load environment
  final env = DotEnv()..load();

  final host = env['HOST'] ?? '0.0.0.0';
  final port = int.parse(env['PORT'] ?? '3000');

  // Initialize database
  await DatabaseService.instance.initialize();

  // Configure middleware
  final corsMiddleware = cors(
    allowOrigin: ['*'],
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'X-Group-Access-Key', 'Authorization'],
  );

  final loggingMiddleware = logRequests();

  final Pipeline pipeline = const Pipeline()
      .addMiddleware(loggingMiddleware)
      .addMiddleware(corsMiddleware)
      .addMiddleware(_securityHeaders)
      .addMiddleware(_contentTypeJson)
      .addHandler(AppRouter().handler);

  // Start server
  final server = await io.serve(pipeline, host, port);
  print('🚀 Equilibra Backend running on http://${server.address.host}:${server.port}');
  print('📡 Environment: ${env['ENV'] ?? 'development'}');
}

Middleware get _securityHeaders => (Handler innerHandler) {
      return (Request request) async {
        final response = await innerHandler(request);
        return response.change(headers: {
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'DENY',
          'X-XSS-Protection': '1; mode=block',
        });
      };
    };

Middleware get _contentTypeJson => (Handler innerHandler) {
      return (Request request) async {
        final response = await innerHandler(request);
        if (response.headers['Content-Type'] == null) {
          return response.change(headers: {
            'Content-Type': 'application/json; charset=utf-8',
          });
        }
        return response;
      };
    };
