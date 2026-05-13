import { useState } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
  Box, Drawer, AppBar, Toolbar, Typography, List, ListItem, ListItemButton,
  ListItemIcon, ListItemText, IconButton, Avatar, Menu, MenuItem, Divider, Chip,
} from '@mui/material'
import {
  Menu as MenuIcon, Dashboard, AccountBalanceWallet, People, Receipt, Settings, Logout,
  AccountBalance, DarkMode, LightMode, Category, InsertDriveFile,
} from '@mui/icons-material'

const drawerWidth = 270

const menuItems = [
  { text: 'Дашборд', icon: <Dashboard />, path: '/' },
  { text: 'Транзакции', icon: <AccountBalanceWallet />, path: '/transactions' },
  { text: 'Клиенты', icon: <People />, path: '/clients' },
  { text: 'Счета', icon: <Receipt />, path: '/invoices' },
  { text: 'Категории', icon: <Category />, path: '/categories' },
  { text: 'Файлы', icon: <InsertDriveFile />, path: '/documents' },
  { text: 'Настройки', icon: <Settings />, path: '/settings' },
]

export default function Layout() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [anchorEl, setAnchorEl] = useState(null)
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
        <Avatar sx={{ bgcolor: 'primary.main', width: 36, height: 36 }}>
          <AccountBalance sx={{ fontSize: 20 }} />
        </Avatar>
        <Box>
          <Typography variant="subtitle2" fontWeight={700} color="primary" lineHeight={1.2}>
            Бухгалтерия
          </Typography>
          <Typography variant="caption" color="text.secondary">Онлайн учёт</Typography>
        </Box>
      </Toolbar>
      <Divider />
      <List sx={{ flex: 1, px: 1.5, py: 1 }}>
        {menuItems.map((item) => {
          const selected = location.pathname === item.path
          return (
            <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                selected={selected}
                onClick={() => { navigate(item.path); setMobileOpen(false) }}
                sx={{ borderRadius: 2, py: 1.2 }}
              >
                <ListItemIcon sx={{ color: selected ? 'primary.main' : 'text.secondary', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{ fontWeight: selected ? 600 : 400, fontSize: '0.95rem' }}
                />
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
      <Divider />
      <Box sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Avatar sx={{ width: 34, height: 34, bgcolor: 'secondary.light', fontSize: 14 }}>
          {user?.username?.[0]?.toUpperCase()}
        </Avatar>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="body2" fontWeight={600} noWrap>{user?.company_name || user?.username}</Typography>
          <Typography variant="caption" color="text.secondary" noWrap>{user?.email}</Typography>
        </Box>
      </Box>
    </Box>
  )

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" elevation={0} sx={{ bgcolor: 'background.paper', borderBottom: '1px solid #f1f5f9', zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar>
          <IconButton color="inherit" edge="start" sx={{ mr: 2, display: { sm: 'none' }, color: 'text.primary' }}
            onClick={() => setMobileOpen(!mobileOpen)}>
            <MenuIcon />
          </IconButton>
          <Typography variant="subtitle1" fontWeight={600} color="text.primary" sx={{ flexGrow: 1 }}>
            {menuItems.find((m) => m.path === location.pathname)?.text || 'Бухгалтерия'}
          </Typography>
          <IconButton onClick={(e) => setAnchorEl(e.currentTarget)}>
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 14 }}>
              {user?.username?.[0]?.toUpperCase()}
            </Avatar>
          </IconButton>
          <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }} anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}>
            <MenuItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
              <Typography variant="body2" fontWeight={600}>{user?.company_name || user?.username}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => { setAnchorEl(null); logout(); navigate('/login') }}>
              <ListItemIcon><Logout fontSize="small" /></ListItemIcon>
              Выйти
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)}
          sx={{ display: { sm: 'none' }, '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #f1f5f9' } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8, minHeight: '100vh', bgcolor: 'background.default' }}>
        <Outlet />
      </Box>
    </Box>
  )
}
