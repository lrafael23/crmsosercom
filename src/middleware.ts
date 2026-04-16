import { NextResponse, type NextRequest } from 'next/server';

// Rutas públicas que no requieren autenticación
const PUBLIC_PATHS = [
  '/',
  '/login',
  '/planes',
  '/registro/estudio',
  '/registro/cliente',
  '/api/mp/webhook', // Los webhooks deben ser públicos
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Permitir rutas estáticas y assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 2. Verificar si es una ruta pública
  const isPublicPath = PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  );

  // NOTA: En este entorno, usamos una cookie 'portal360-token' o similar
  // para verificar la sesión en el middleware.
  const session = request.cookies.get('portal360-session');

  // 3. Redirección si no hay sesión y la ruta es privada
  if (!isPublicPath && !session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 4. Protección por rol (basada en cookie de rol si existe)
  const userRole = request.cookies.get('portal360-role')?.value;

  if (session && userRole) {
    // 0. Super Admin Global tiene acceso total e irrestricto
    if (userRole === 'super_admin_global') {
      return NextResponse.next();
    }

    // Protección de rutas de Super Admin
    if (pathname.startsWith('/super-admin') && userRole !== 'super_admin_global') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Protección de rutas de Admin Sosercom
    if (pathname.startsWith('/admin') && userRole !== 'admin' && userRole !== 'super_admin_global') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Protección de rutas de Estudio Jurídico
    const firmRoles = ['owner_firm', 'abogado', 'contador', 'tributario', 'staff'];
    if (pathname.startsWith('/firm') && !firmRoles.includes(userRole) && userRole !== 'super_admin_global') {
      return NextResponse.redirect(new URL('/', request.url));
    }

    // Protección de rutas de Cliente Final
    const clientRoles = ['cliente_final', 'cliente'];
    if (pathname.startsWith('/cliente') && !clientRoles.includes(userRole) && userRole !== 'super_admin_global') {
      return NextResponse.redirect(new URL('/', request.url));
    }
    // Rutas protegidas por rol
    // (Se eliminó la redirección automática de /login para permitir lógica de cambio de sesión en el componente)
  }

  return NextResponse.next();
}

// Configurar los matchers
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
