import DashboardRounded from '@mui/icons-material/DashboardRounded';
import PeopleAltRounded from '@mui/icons-material/PeopleAltRounded';
import Inventory2Rounded from '@mui/icons-material/Inventory2Rounded';
import LocalShippingRounded from '@mui/icons-material/LocalShippingRounded';
import TrendingUpRounded from '@mui/icons-material/TrendingUpRounded';
import ReceiptLongRounded from '@mui/icons-material/ReceiptLongRounded';
import AccountBalanceWalletRounded from '@mui/icons-material/AccountBalanceWalletRounded';
import BarChartRounded from '@mui/icons-material/BarChartRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import SettingsRounded from '@mui/icons-material/SettingsRounded';
import LogoutRounded from '@mui/icons-material/LogoutRounded';
import SearchRounded from '@mui/icons-material/SearchRounded';
import NotificationsRounded from '@mui/icons-material/NotificationsRounded';
import MenuRounded from '@mui/icons-material/MenuRounded';
import AddRounded from '@mui/icons-material/AddRounded';
import FilterListRounded from '@mui/icons-material/FilterListRounded';
import DownloadRounded from '@mui/icons-material/DownloadRounded';
import PrintRounded from '@mui/icons-material/PrintRounded';
import EditRounded from '@mui/icons-material/EditRounded';
import DeleteRounded from '@mui/icons-material/DeleteRounded';
import VisibilityRounded from '@mui/icons-material/VisibilityRounded';
import ShowChartRounded from '@mui/icons-material/ShowChartRounded';
import PieChartRounded from '@mui/icons-material/PieChartRounded';
import SendRounded from '@mui/icons-material/SendRounded';
import ReceiptRounded from '@mui/icons-material/ReceiptRounded';
import WarehouseRounded from '@mui/icons-material/WarehouseRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';

const iconMap = {
  dashboard:  DashboardRounded,
  customers:  PeopleAltRounded,
  products:   Inventory2Rounded,
  suppliers:  LocalShippingRounded,
  sales:      TrendingUpRounded,
  invoices:   ReceiptLongRounded,
  expenses:   AccountBalanceWalletRounded,
  reports:    BarChartRounded,
  ai:         AutoAwesomeRounded,
  settings:   SettingsRounded,
  logout:     LogoutRounded,
  search:     SearchRounded,
  bell:       NotificationsRounded,
  menu:       MenuRounded,
  plus:       AddRounded,
  filter:     FilterListRounded,
  download:   DownloadRounded,
  print:      PrintRounded,
  edit:       EditRounded,
  trash:      DeleteRounded,
  view:       VisibilityRounded,
  revenue:    ShowChartRounded,
  profit:     PieChartRounded,
  send:       SendRounded,
  invoice:    ReceiptRounded,
  inventory:  WarehouseRounded,
  close:      CloseRounded,
};

export default function Icon({ name, size = 20 }) {
  const MuiIcon = iconMap[name] || DashboardRounded;
  return <MuiIcon style={{ fontSize: size }} aria-hidden="true" />;
}
