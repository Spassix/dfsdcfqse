/**
 * Bot Telegram pour le Panel Admin
 * Gestion complète de la boutique via Telegram
 * Beaucoup plus sécurisé qu'un panel web
 */

import { adminUsers, redis } from './db.js'
import { verifyAuth } from './auth-utils.js'
import { logSecurityEvent } from './security-utils.js'

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN
const TELEGRAM_ADMIN_CHAT_ID = process.env.TELEGRAM_ADMIN_CHAT_ID

if (!TELEGRAM_BOT_TOKEN) {
  console.error('⚠️  TELEGRAM_BOT_TOKEN doit être défini dans les variables d\'environnement')
}

/**
 * Envoie un message via le bot Telegram
 */
export async function sendTelegramMessage(chatId, text, options = {}) {
  if (!TELEGRAM_BOT_TOKEN) {
    console.error('Bot Telegram non configuré')
    return null
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        parse_mode: 'HTML',
        ...options
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Erreur Telegram:', error)
      return null
    }

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message Telegram:', error)
    return null
  }
}

/**
 * Envoie une photo via le bot Telegram
 */
export async function sendTelegramPhoto(chatId, photoUrl, caption = '') {
  if (!TELEGRAM_BOT_TOKEN) {
    return null
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendPhoto`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        photo: photoUrl,
        caption: caption,
        parse_mode: 'HTML'
      })
    })

    return await response.json()
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la photo:', error)
    return null
  }
}

/**
 * Crée un clavier inline pour les commandes principales
 */
export function createAdminKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '📦 Produits', callback_data: 'admin_products' },
        { text: '🏷️ Catégories', callback_data: 'admin_categories' }
      ],
      [
        { text: '🌾 Farms', callback_data: 'admin_farms' },
        { text: '🎟️ Promos', callback_data: 'admin_promos' }
      ],
      [
        { text: '💬 Avis', callback_data: 'admin_reviews' },
        { text: '👥 Utilisateurs', callback_data: 'admin_users' }
      ],
      [
        { text: '⚙️ Paramètres', callback_data: 'admin_settings' },
        { text: '📊 Statistiques', callback_data: 'admin_stats' }
      ],
      [
        { text: '➕ Ajouter Produit', callback_data: 'product_add' },
        { text: '➕ Ajouter Catégorie', callback_data: 'category_add' }
      ],
      [
        { text: '🔐 Déconnexion', callback_data: 'admin_logout' }
      ]
    ]
  }
}

/**
 * Crée un clavier pour la navigation des produits
 */
export function createProductsKeyboard(page = 0, totalPages = 1, productId = null) {
  const keyboard = []
  
  // Boutons de navigation
  const navRow = []
  if (page > 0) {
    navRow.push({ text: '◀️ Précédent', callback_data: `products_page_${page - 1}` })
  }
  if (page < totalPages - 1) {
    navRow.push({ text: 'Suivant ▶️', callback_data: `products_page_${page + 1}` })
  }
  if (navRow.length > 0) {
    keyboard.push(navRow)
  }

  // Boutons d'action pour un produit spécifique
  if (productId) {
    keyboard.push([
      { text: '✏️ Modifier', callback_data: `product_edit_${productId}` },
      { text: '🗑️ Supprimer', callback_data: `product_delete_${productId}` }
    ])
  }

  // Boutons principaux
  keyboard.push([
    { text: '➕ Ajouter Produit', callback_data: 'product_add' },
    { text: '🔙 Menu Principal', callback_data: 'admin_menu' }
  ])

  return { inline_keyboard: keyboard }
}

/**
 * Crée un clavier pour les catégories
 */
export function createCategoriesKeyboard() {
  return {
    inline_keyboard: [
      [
        { text: '➕ Ajouter Catégorie', callback_data: 'category_add' },
        { text: '🔙 Menu Principal', callback_data: 'admin_menu' }
      ]
    ]
  }
}

/**
 * Supprime un message Telegram
 */
async function deleteTelegramMessage(chatId, messageId) {
  if (!TELEGRAM_BOT_TOKEN) return

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/deleteMessage`
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        message_id: messageId
      })
    })
  } catch (error) {
    // Ignorer les erreurs de suppression
  }
}

/**
 * Vérifie et limite le spam
 */
async function checkSpam(chatId, username) {
  const spamKey = `telegram_spam:${chatId}`
  const spamCount = await redis.incr(spamKey)
  await redis.expire(spamKey, 60) // Expire après 1 minute

  // Si plus de 10 messages en 1 minute = spam
  if (spamCount > 10) {
    await logSecurityEvent('telegram_spam_detected', { chatId, username, count: spamCount })
    return true
  }

  return false
}

/**
 * Traite les commandes du bot Telegram
 */
export async function handleTelegramCommand(command, chatId, messageId, username) {
  try {
    // Vérifier le spam
    if (await checkSpam(chatId, username)) {
      await sendTelegramMessage(chatId, 
        '⚠️ <b>Spam détecté</b>\n\n' +
        'Trop de messages envoyés. Veuillez patienter.'
      )
      return
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = await verifyTelegramAdmin(chatId, username)
    if (!isAdmin) {
      await sendTelegramMessage(chatId, 
        '❌ <b>Accès refusé</b>\n\n' +
        'Vous n\'êtes pas administrateur.\n\n' +
        'Utilisez uniquement les boutons pour naviguer.',
        { reply_markup: { inline_keyboard: [] } }
      )
      return
    }

    // Supprimer le message de commande texte (anti-spam)
    if (messageId) {
      await deleteTelegramMessage(chatId, messageId)
    }

    switch (command) {
      case '/start':
      case '/admin':
        await sendTelegramMessage(chatId, 
          '👋 <b>Panel Admin Telegram</b>\n\n' +
          'Bienvenue dans le panel d\'administration de la boutique.\n\n' +
          '⚠️ <b>Important:</b> Utilisez uniquement les boutons ci-dessous.\n' +
          'Les messages texte seront automatiquement supprimés.',
          { reply_markup: createAdminKeyboard() }
        )
        break

      default:
        // Pour toutes les autres commandes texte, afficher le menu
        await sendTelegramMessage(chatId,
          '⚠️ <b>Utilisez les boutons</b>\n\n' +
          'Ce bot fonctionne uniquement avec les boutons inline.\n' +
          'Les commandes texte ne sont pas acceptées.\n\n' +
          'Sélectionnez une option ci-dessous:',
          { reply_markup: createAdminKeyboard() }
        )
    }
  } catch (error) {
    console.error('Erreur lors du traitement de la commande:', error)
    await sendTelegramMessage(chatId, '❌ Une erreur est survenue. Veuillez réessayer.')
  }
}

/**
 * Traite les callbacks (boutons inline)
 */
export async function handleTelegramCallback(callbackData, chatId, messageId, username) {
  try {
    // Vérifier le spam
    if (await checkSpam(chatId, username)) {
      return // Ignorer les callbacks si spam
    }

    // Vérifier que l'utilisateur est admin
    const isAdmin = await verifyTelegramAdmin(chatId, username)
    if (!isAdmin) {
      await sendTelegramMessage(chatId, 
        '❌ <b>Accès refusé</b>\n\n' +
        'Vous n\'êtes pas administrateur.',
        { reply_markup: { inline_keyboard: [] } }
      )
      return
    }

    // Menu principal
    if (callbackData === 'admin_menu') {
      await sendTelegramMessage(chatId,
        '👋 <b>Panel Admin Telegram</b>\n\n' +
        'Sélectionnez une option:',
        { reply_markup: createAdminKeyboard() }
      )
      return
    }

    // Produits
    if (callbackData === 'admin_products') {
      await handleProductsCommand(chatId, 0)
      return
    }

    if (callbackData.startsWith('products_page_')) {
      const page = parseInt(callbackData.split('_')[2]) || 0
      await handleProductsCommand(chatId, page)
      return
    }

    if (callbackData.startsWith('product_view_')) {
      const productId = callbackData.split('_')[2]
      await handleProductView(chatId, productId)
      return
    }

    if (callbackData.startsWith('product_edit_')) {
      const productId = callbackData.split('_')[2]
      await sendTelegramMessage(chatId,
        '✏️ <b>Modifier un Produit</b>\n\n' +
        `ID: <code>${productId}</code>\n\n` +
        'Pour modifier un produit, utilisez le panel web ou contactez le développeur.',
        { reply_markup: createProductsKeyboard(0, 1, productId) }
      )
      return
    }

    if (callbackData.startsWith('product_delete_')) {
      const productId = callbackData.split('_')[2]
      await handleProductDelete(chatId, productId)
      return
    }

    if (callbackData === 'product_add') {
      await sendTelegramMessage(chatId,
        '➕ <b>Ajouter un Produit</b>\n\n' +
        'Pour ajouter un produit:\n\n' +
        '1. Utilisez le panel web (mode démonstration)\n' +
        '2. Ou contactez le développeur\n\n' +
        'Les ajouts directs via Telegram seront disponibles prochainement.',
        { reply_markup: createProductsKeyboard() }
      )
      return
    }

    // Catégories
    if (callbackData === 'admin_categories') {
      await handleCategoriesCommand(chatId)
      return
    }

    if (callbackData === 'category_add') {
      await sendTelegramMessage(chatId,
        '➕ <b>Ajouter une Catégorie</b>\n\n' +
        'Pour ajouter une catégorie:\n\n' +
        '1. Utilisez le panel web (mode démonstration)\n' +
        '2. Ou contactez le développeur\n\n' +
        'Les ajouts directs via Telegram seront disponibles prochainement.',
        { reply_markup: createCategoriesKeyboard() }
      )
      return
    }

    // Statistiques
    if (callbackData === 'admin_stats') {
      await handleStatsCommand(chatId)
      return
    }

    // Autres menus
    if (callbackData === 'admin_farms') {
      await sendTelegramMessage(chatId,
        '🌾 <b>Farms</b>\n\n' +
        'Gestion des farms disponible via le panel web.',
        { reply_markup: createAdminKeyboard() }
      )
      return
    }

    if (callbackData === 'admin_promos') {
      await sendTelegramMessage(chatId,
        '🎟️ <b>Promos</b>\n\n' +
        'Gestion des promos disponible via le panel web.',
        { reply_markup: createAdminKeyboard() }
      )
      return
    }

    if (callbackData === 'admin_reviews') {
      await sendTelegramMessage(chatId,
        '💬 <b>Avis</b>\n\n' +
        'Gestion des avis disponible via le panel web.',
        { reply_markup: createAdminKeyboard() }
      )
      return
    }

    if (callbackData === 'admin_users') {
      await sendTelegramMessage(chatId,
        '👥 <b>Utilisateurs</b>\n\n' +
        'Gestion des utilisateurs disponible via le panel web.',
        { reply_markup: createAdminKeyboard() }
      )
      return
    }

    if (callbackData === 'admin_settings') {
      await sendTelegramMessage(chatId,
        '⚙️ <b>Paramètres</b>\n\n' +
        'Gestion des paramètres disponible via le panel web.',
        { reply_markup: createAdminKeyboard() }
      )
      return
    }

    // Déconnexion
    if (callbackData === 'admin_logout') {
      await redis.del(`telegram_admin:${chatId}`)
      await sendTelegramMessage(chatId, 
        '✅ <b>Déconnexion réussie</b>\n\n' +
        'Vous avez été déconnecté du panel admin.',
        { reply_markup: { inline_keyboard: [] } }
      )
      return
    }

    await sendTelegramMessage(chatId, '❓ Action non reconnue.', { reply_markup: createAdminKeyboard() })
  } catch (error) {
    console.error('Erreur lors du traitement du callback:', error)
    await sendTelegramMessage(chatId, '❌ Une erreur est survenue.', { reply_markup: createAdminKeyboard() })
  }
}

/**
 * Vérifie si un utilisateur Telegram est admin
 */
async function verifyTelegramAdmin(chatId, username) {
  // Vérifier dans Redis si l'utilisateur est autorisé
  const adminKey = `telegram_admin:${chatId}`
  const isAuthorized = await redis.get(adminKey)
  
  if (isAuthorized === 'true') {
    return true
  }

  // Vérifier si c'est le chat ID admin configuré
  if (TELEGRAM_ADMIN_CHAT_ID && chatId.toString() === TELEGRAM_ADMIN_CHAT_ID.toString()) {
    await redis.setex(adminKey, 86400, 'true') // Cache 24h
    return true
  }

  // Vérifier dans la base de données admin
  try {
    const user = await adminUsers.getByUsername(username || `telegram_${chatId}`)
    if (user && user.role === 'admin') {
      await redis.setex(adminKey, 86400, 'true')
      return true
    }
  } catch (error) {
    // Ignorer les erreurs
  }

  return false
}

/**
 * Gère la commande /products
 */
async function handleProductsCommand(chatId, page = 0) {
  try {
    // Récupérer les produits depuis l'API interne (pas via HTTP)
    const { products } = await import('./db.js')
    const allProducts = await products.getAll()
    
    const pageSize = 5
    const totalPages = Math.ceil(allProducts.length / pageSize)
    const startIndex = page * pageSize
    const endIndex = startIndex + pageSize
    const pageProducts = allProducts.slice(startIndex, endIndex)

    if (pageProducts.length === 0) {
      await sendTelegramMessage(chatId,
        '📦 <b>Produits</b>\n\n' +
        'Aucun produit trouvé.\n\n' +
        'Utilisez /add_product pour ajouter un produit.',
        { reply_markup: createProductsKeyboard(page, totalPages) }
      )
      return
    }

    let message = `📦 <b>Produits</b> (Page ${page + 1}/${totalPages})\n\n`
    
    // Créer un clavier avec les produits cliquables
    const keyboard = []
    
    pageProducts.forEach((product, index) => {
      const productName = (product.name || 'Sans nom').substring(0, 30)
      keyboard.push([
        { 
          text: `${startIndex + index + 1}. ${productName} - ${product.price || 'N/A'}€`, 
          callback_data: `product_view_${product.id}` 
        }
      ])
    })

    // Boutons de navigation
    const navRow = []
    if (page > 0) {
      navRow.push({ text: '◀️ Précédent', callback_data: `products_page_${page - 1}` })
    }
    if (page < totalPages - 1) {
      navRow.push({ text: 'Suivant ▶️', callback_data: `products_page_${page + 1}` })
    }
    if (navRow.length > 0) {
      keyboard.push(navRow)
    }

    // Boutons d'action
    keyboard.push([
      { text: '➕ Ajouter Produit', callback_data: 'product_add' },
      { text: '🔙 Menu Principal', callback_data: 'admin_menu' }
    ])

    await sendTelegramMessage(chatId, message, {
      reply_markup: { inline_keyboard: keyboard }
    })
  } catch (error) {
    console.error('Erreur produits:', error)
    await sendTelegramMessage(chatId, '❌ Erreur lors de la récupération des produits.')
  }
}

/**
 * Gère la commande /categories
 */
async function handleCategoriesCommand(chatId) {
  try {
    // Récupérer directement depuis la DB
    const { categories } = await import('./db.js')
    const allCategories = await categories.getAll()
    
    if (allCategories.length === 0) {
      await sendTelegramMessage(chatId, 
        '🏷️ <b>Catégories</b>\n\n' +
        'Aucune catégorie trouvée.\n\n' +
        'Utilisez /add_category pour ajouter une catégorie.'
      )
      return
    }

    let message = '🏷️ <b>Catégories</b>\n\n'
    const keyboard = []
    
    allCategories.forEach((cat, index) => {
      message += `${index + 1}. <b>${cat.name || 'Sans nom'}</b>\n`
      if (cat.description) {
        message += `   ${cat.description}\n`
      }
      message += `   [ID: ${cat.id}]\n\n`
    })

    // Boutons d'action
    keyboard.push([
      { text: '➕ Ajouter Catégorie', callback_data: 'category_add' },
      { text: '🔙 Menu Principal', callback_data: 'admin_menu' }
    ])

    await sendTelegramMessage(chatId, message, {
      reply_markup: { inline_keyboard: keyboard }
    })
  } catch (error) {
    console.error('Erreur catégories:', error)
    await sendTelegramMessage(chatId, '❌ Erreur lors de la récupération des catégories.')
  }
}

/**
 * Gère la commande /stats
 */
async function handleStatsCommand(chatId) {
  try {
    // Récupérer directement depuis la DB
    const { products, categories, reviews } = await import('./db.js')
    
    const [allProducts, allCategories, allReviews] = await Promise.all([
      products.getAll(),
      categories.getAll(),
      reviews.getAll()
    ])

    const activeProducts = allProducts.filter(p => p.active !== false).length
    const totalRevenue = allProducts.reduce((sum, p) => sum + (parseFloat(p.price) || 0), 0)

    const message = 
      '📊 <b>Statistiques de la Boutique</b>\n\n' +
      `📦 Produits: <b>${allProducts.length}</b>\n` +
      `   └ Actifs: <b>${activeProducts}</b>\n` +
      `🏷️ Catégories: <b>${allCategories.length}</b>\n` +
      `💬 Avis: <b>${allReviews.length}</b>\n\n` +
      `💰 Valeur totale: <b>${totalRevenue.toFixed(2)}€</b>`

    await sendTelegramMessage(chatId, message)
  } catch (error) {
    console.error('Erreur stats:', error)
    await sendTelegramMessage(chatId, '❌ Erreur lors de la récupération des statistiques.')
  }
}

/**
 * Affiche les détails d'un produit
 */
async function handleProductView(chatId, productId) {
  try {
    const { products } = await import('./db.js')
    const product = await products.getById(productId)
    
    if (!product) {
      await sendTelegramMessage(chatId, '❌ Produit non trouvé.', { reply_markup: createProductsKeyboard() })
      return
    }

    let message = `📦 <b>${product.name || 'Sans nom'}</b>\n\n`
    message += `💰 Prix: <b>${product.price || 'N/A'}€</b>\n`
    message += `🏷️ Catégorie: ${product.category || 'N/A'}\n`
    if (product.description) {
      message += `\n📝 <b>Description:</b>\n${product.description}\n`
    }
    if (product.variants && product.variants.length > 0) {
      message += `\n📋 Variantes: ${product.variants.length}\n`
    }
    message += `\n🆔 ID: <code>${product.id}</code>`

    const keyboard = [
      [
        { text: '✏️ Modifier', callback_data: `product_edit_${productId}` },
        { text: '🗑️ Supprimer', callback_data: `product_delete_${productId}` }
      ],
      [
        { text: '🔙 Retour Produits', callback_data: 'admin_products' },
        { text: '🏠 Menu Principal', callback_data: 'admin_menu' }
      ]
    ]

    await sendTelegramMessage(chatId, message, {
      reply_markup: { inline_keyboard: keyboard }
    })
  } catch (error) {
    console.error('Erreur vue produit:', error)
    await sendTelegramMessage(chatId, '❌ Erreur lors de l\'affichage du produit.')
  }
}

/**
 * Supprime un produit
 */
async function handleProductDelete(chatId, productId) {
  try {
    const { products } = await import('./db.js')
    await products.delete(productId)
    
    await sendTelegramMessage(chatId,
      '✅ <b>Produit supprimé</b>\n\n' +
      `Le produit <code>${productId}</code> a été supprimé avec succès.`,
      { reply_markup: createProductsKeyboard() }
    )
  } catch (error) {
    console.error('Erreur suppression produit:', error)
    await sendTelegramMessage(chatId, '❌ Erreur lors de la suppression du produit.')
  }
}

/**
 * Webhook handler pour recevoir les messages Telegram
 */
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const update = req.body

    // Traiter les messages texte (anti-spam)
    if (update.message) {
      const { chat, text, from } = update.message
      const chatId = chat.id
      const username = from.username || from.first_name
      const messageId = update.message.message_id

      // Vérifier le spam
      if (await checkSpam(chatId, username)) {
        // Supprimer le message spam
        await deleteTelegramMessage(chatId, messageId)
        await sendTelegramMessage(chatId,
          '⚠️ <b>Spam détecté</b>\n\n' +
          'Trop de messages. Utilisez uniquement les boutons.',
          { reply_markup: createAdminKeyboard() }
        )
        return res.status(200).json({ ok: true })
      }

      // Si c'est une commande /start, la traiter
      if (text && text.startsWith('/start')) {
        const command = text.split(' ')[0]
        await handleTelegramCommand(command, chatId, messageId, username)
      } else if (text) {
        // Supprimer tous les autres messages texte (anti-spam)
        await deleteTelegramMessage(chatId, messageId)
        
        // Envoyer un message pour rappeler d'utiliser les boutons
        await sendTelegramMessage(chatId,
          '⚠️ <b>Utilisez les boutons</b>\n\n' +
          'Ce bot fonctionne uniquement avec les boutons inline.\n' +
          'Les messages texte sont automatiquement supprimés.\n\n' +
          'Sélectionnez une option ci-dessous:',
          { reply_markup: createAdminKeyboard() }
        )
      }
    }

    // Traiter les callbacks (boutons inline)
    if (update.callback_query) {
      const { data, message, from } = update.callback_query
      const chatId = message.chat.id
      const username = from.username || from.first_name
      const messageId = message.message_id

      await handleTelegramCallback(data, chatId, messageId, username)

      // Répondre au callback pour enlever le "loading"
      const callbackUrl = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/answerCallbackQuery`
      await fetch(callbackUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callback_query_id: update.callback_query.id
        })
      })
    }

    return res.status(200).json({ ok: true })
  } catch (error) {
    console.error('Erreur webhook Telegram:', error)
    await logSecurityEvent('telegram_webhook_error', { error: error.message }, req)
    return res.status(200).json({ ok: true }) // Toujours retourner 200 pour Telegram
  }
}
