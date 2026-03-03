
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import { dashboardService } from '@/services/dashboardService';
import { Link } from 'react-router-dom';
import { Users, FileText, BarChart2, Settings, LayoutGrid, AlertCircle } from 'lucide-react';

const RecentUserCard = ({ user }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  return (
    <div className="flex items-center p-4 border rounded-lg mb-2">
      <div className="w-10 h-10 rounded-full bg-[var(--color-primary-300)] flex items-center justify-center text-white font-bold mr-4">
        {user.first_name ? user.first_name.charAt(0) : user.email ? user.email.charAt(0).toUpperCase() : 'U'}
      </div>
      <div className="flex-1">
        <h4 className="font-medium">
          {user.first_name && user.last_name
            ? `${user.first_name} ${user.last_name}`
            : user.email || 'User'}
        </h4>
        <p className="text-sm text-gray-500">
          Registered: {formatDate(user.created_at)}
        </p>
        {user.email && (
          <p className="text-sm text-gray-400">{user.email}</p>
        )}
      </div>
      <Link to={`/admin/users?id=${user.id}`}>
        <Button variant="outline" size="sm">
          Details
        </Button>
      </Link>
    </div>
  );
};

const AdminDashboard = () => {
  const { toast } = useToast();
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeQuestionnaires: 0,
    completedQuestionnaires: 0,
    totalReports: 0
  });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentQuestionnaires, setRecentQuestionnaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(false);
        
        console.log('🔄 Loading dashboard data from MySQL...');
        
        // Fetch dashboard statistics from MySQL
        const statsData = await dashboardService.getDashboardStats();
        console.log('📊 Stats loaded:', statsData);
        
        setStats({
          totalUsers: statsData.totalUsers,
          activeQuestionnaires: statsData.activeQuestionnaires,
          completedQuestionnaires: statsData.completedQuestionnaires,
          totalReports: statsData.totalReports
        });
        
        // Fetch recent users from MySQL
        try {
          const usersData = await dashboardService.getRecentUsers();
          console.log('👥 Recent users loaded:', usersData.length);
          setRecentUsers(usersData || []);
        } catch (userError) {
          console.error('Error loading recent users:', userError);
          setRecentUsers([]);
        }
        
        // Fetch recent questionnaire responses from MySQL
        try {
          const responsesData = await dashboardService.getRecentResponses();
          console.log('📝 Recent responses loaded:', responsesData.length);
          setRecentQuestionnaires(responsesData || []);
        } catch (responseError) {
          console.error('Error loading recent responses:', responseError);
          setRecentQuestionnaires([]);
        }
        
      } catch (error) {
        console.error('❌ Error fetching dashboard data:', error);
        setError(true);
        toast({
          title: 'Error',
          description: 'Unable to load dashboard data from the database.',
          variant: 'destructive',
        });
        
        // Set default values on error
        setStats({
          totalUsers: 0,
          activeQuestionnaires: 0,
          completedQuestionnaires: 0,
          totalReports: 0
        });
        setRecentUsers([]);
        setRecentQuestionnaires([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, [toast]);

  if (loading) {
    return <div className="flex justify-center p-10">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Administration Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome to the SimplyAI control panel
        </p>
      </div>
      
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-md flex items-start mb-6">
          <AlertCircle className="h-5 w-5 mr-2 mt-0.5" />
          <div>
            <h3 className="font-medium">Database connection error</h3>
            <p className="text-sm">Unable to load dashboard data. Please check the MySQL connection.</p>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.totalUsers}</CardTitle>
            <CardDescription>Total Users</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/users">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <Users className="mr-2 h-4 w-4" />
                Manage Users
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.activeQuestionnaires}</CardTitle>
            <CardDescription>Active Questionnaires</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/form-builder">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                Manage Forms
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.completedQuestionnaires}</CardTitle>
            <CardDescription>Completed Questionnaires</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/form-builder">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <LayoutGrid className="mr-2 h-4 w-4" />
                Form Builder
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-2xl">{stats.totalReports}</CardTitle>
            <CardDescription>Generated Reports</CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/admin/reports">
              <Button variant="outline" className="w-full mt-2" size="sm">
                <BarChart2 className="mr-2 h-4 w-4" />
                View Reports
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
      
      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">Latest Users</TabsTrigger>
          <TabsTrigger value="questionnaires">Latest Questionnaires</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Latest Registered Users</CardTitle>
              <CardDescription>
                The most recently registered users on the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentUsers.length > 0 ? (
                <div className="space-y-2">
                  {recentUsers.map((user) => (
                    <RecentUserCard key={user.id} user={user} />
                  ))}
                  <div className="mt-4 text-center">
                    <Link to="/admin/users">
                      <Button>View all users</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p>No registered users.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="questionnaires">
          <Card>
            <CardHeader>
              <CardTitle>Latest Questionnaires</CardTitle>
              <CardDescription>
                The most recently completed questionnaires by users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {recentQuestionnaires.length > 0 ? (
                <div className="space-y-4">
                  {recentQuestionnaires.map((questionnaire) => (
                    <div key={questionnaire.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">
                          Questionnaire #{String(questionnaire.id ?? "").substring(0, 8)}
                        </h4>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            questionnaire.status === 'completed'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {questionnaire.status === 'completed' ? 'Completed' : 'Draft'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {questionnaire.first_name && questionnaire.last_name
                          ? `${questionnaire.first_name} ${questionnaire.last_name}`
                          : questionnaire.email || `User ID: ${String(questionnaire.user_id ?? "").substring(0, 8)}`}
                      </p>
                      <p className="text-sm text-gray-500">
                        Date: {new Date(questionnaire.created_at).toLocaleDateString('en-US')}
                      </p>
                      {questionnaire.updated_at && questionnaire.updated_at !== questionnaire.created_at && (
                        <p className="text-sm text-gray-400">
                          Updated: {new Date(questionnaire.updated_at).toLocaleDateString('en-US')}
                        </p>
                      )}
                    </div>
                  ))}
                  <div className="mt-4 text-center">
                    <Link to="/admin/form-builder">
                      <Button>View all questionnaires</Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <p>No questionnaires submitted.</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>
              Quickly manage the main features
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link to="/admin/users">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Users className="mr-2 h-5 w-5" />
                User Management
              </Button>
            </Link>
            <Link to="/admin/page-editor">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                Page Editor
              </Button>
            </Link>
            <Link to="/admin/form-builder">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <LayoutGrid className="mr-2 h-5 w-5" />
                Form Builder
              </Button>
            </Link>
            <Link to="/admin/settings">
              <Button variant="outline" className="w-full justify-start" size="lg">
                <Settings className="mr-2 h-5 w-5" />
                System Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>
              Statistics and system information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Versione</span>
                <span>1.0.0</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Database MySQL</span>
                <span className={error ? "text-red-600" : "text-green-600"}>
                  {error ? "Connection error" : "Online"}
                </span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Storage</span>
                <span className="text-green-600">Online</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b">
                <span className="font-medium">Questionnaires</span>
                <span>{stats.activeQuestionnaires + stats.completedQuestionnaires} total</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Generated reports</span>
                <span>{stats.totalReports}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminDashboard;
