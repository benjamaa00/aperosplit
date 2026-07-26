import 'package:shelf/shelf.dart';
import 'package:shelf/shelf_io.dart' as io;
import 'package:dotenv/dotenv.dart';
import 'package:equilibra_backend/src/database/database.dart';
import 'package:equilibra_backend/src/router/app_router.dart';

void main(List<String> args) async {
  final env = DotEnv()..load();

  final host = env['HOST'] ?? '0.0.0.0';
  final port = int.parse(env['PORT'] ?? '3000');

  await DatabaseService.instance.initialize();

  final corsMiddleware = _cors();

  final loggingMiddleware = logRequests();

  final handler = const Pipeline()
      .addMiddleware(loggingMiddleware)
      .addMiddleware(corsMiddleware)
      .addMiddleware(_securityHeaders)
      .addMiddleware(_contentTypeJson)
      .addHandler(AppRouter().router.call);

  final server = await io.serve(handler, host, port);
  print('Equilibra Backend running on http://${server.address.host}:${server.port}');
  print('Environment: ${env['ENV'] ?? 'development'}');
}

Middleware _cors() => (Handler innerHandler) {
      return (Request request) async {
        if (request.method == 'OPTIONS') {
          return Response.ok('', headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Group-Access-Key, Authorization',
            'Access-Control-Max-Age': '86400',
          });
        }
        final response = await innerHandler(request);
        return response.change(headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, X-Group-Access-Key, Authorization',
        });
      };
    };

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
