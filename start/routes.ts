/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { middleware } from '#start/kernel'

const AuthController = () => import('#controllers/auth_controller')
const TattoosController = () => import('#controllers/tattoos_controller')

/**
 * Health check / API root.
 */
router.get('/', () => {
  return { name: 'Tattoo Sketch Generator API', status: 'ok' }
})

router
  .group(() => {
    /**
     * Authentication
     */
    router.post('/auth/register', [AuthController, 'register'])
    router.post('/auth/login', [AuthController, 'login'])
    router.post('/auth/forgot-password', [AuthController, 'forgotPassword'])
    router.post('/auth/reset-password', [AuthController, 'resetPassword'])
    router.post('/auth/logout', [AuthController, 'logout']).use(middleware.auth())
    router.get('/auth/me', [AuthController, 'me']).use(middleware.auth())

    /**
     * Public image streaming (loaded directly by <img> tags).
     */
    router.get('/tattoos/images/:filename', [TattoosController, 'serveImage'])

    /**
     * Tattoo generation + history (authenticated).
     */
    router
      .group(() => {
        router.post('/tattoos/generate', [TattoosController, 'generate'])
        router.post('/tattoos/suggest-prompt', [TattoosController, 'suggestPrompt'])
        router
          .post('/tattoos/:id/edit', [TattoosController, 'edit'])
          .where('id', router.matchers.number())
        router.get('/tattoos', [TattoosController, 'index'])
        router.get('/tattoos/:id', [TattoosController, 'show']).where('id', router.matchers.number())
        router
          .delete('/tattoos/:id', [TattoosController, 'destroy'])
          .where('id', router.matchers.number())
      })
      .use(middleware.auth())
  })
  .prefix('/api')
