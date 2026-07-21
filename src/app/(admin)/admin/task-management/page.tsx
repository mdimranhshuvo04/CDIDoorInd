'use client';

import { useState, useEffect } from 'react';
import { 
  Briefcase, 
  UserPlus, 
  DollarSign, 
  Trash2,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import Swal from 'sweetalert2';

export default function AdminTaskManagementPage() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal & Form States
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignEmployeeId, setAssignEmployeeId] = useState('');
  const [assignTitle, setAssignTitle] = useState('');
  const [assignDescription, setAssignDescription] = useState('');
  const [assignPayout, setAssignPayout] = useState('');
  const [assignDueDate, setAssignDueDate] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [empRes, taskRes] = await Promise.all([
        fetch('/api/admin/employees'),
        fetch('/api/admin/employees/tasks')
      ]);

      if (empRes.ok) {
        const empData = await empRes.ok ? await empRes.json() : {};
        setEmployees(empData.employees || []);
      }
      if (taskRes.ok) {
        const taskData = await taskRes.json();
        setTasks(taskData.tasks || []);
      }
    } catch (error) {
      console.error('Error fetching task management data:', error);
      toast.error('Failed to load tasks and staff');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignEmployeeId || !assignTitle || !assignPayout) {
      toast.error('Employee, Title, and Payout amount are required');
      return;
    }
    try {
      const response = await fetch('/api/admin/employees/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: assignEmployeeId,
          title: assignTitle,
          description: assignDescription,
          payout: Number(assignPayout),
          dueDate: assignDueDate || undefined
        })
      });

      if (response.ok) {
        Swal.fire({
          icon: 'success',
          title: 'Assigned!',
          text: 'Task assigned successfully to the employee',
          confirmButtonColor: '#eab308'
        });
        setShowAssignModal(false);
        setAssignEmployeeId('');
        setAssignTitle('');
        setAssignDescription('');
        setAssignPayout('');
        setAssignDueDate('');
        fetchData();
      } else {
        const data = await response.json();
        toast.error(data.message || 'Failed to assign task');
      }
    } catch (err) {
      toast.error('Something went wrong');
    }
  };

  const handleDeleteTask = async (id: string) => {
    const result = await Swal.fire({
      title: 'Are you sure?',
      text: 'This will delete the pending task assignment!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Yes, Delete',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6'
    });

    if (result.isConfirmed) {
      try {
        const response = await fetch(`/api/admin/employees/tasks/${id}`, {
          method: 'DELETE'
        });

        if (response.ok) {
          toast.success('Task deleted successfully');
          fetchData();
        } else {
          const data = await response.json();
          toast.error(data.message || 'Failed to delete task');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const handleDisburseTaskPayout = async (task: any) => {
    const result = await Swal.fire({
      title: 'Disburse Task Payout',
      text: `Are you sure you want to disburse ${task.payout.toLocaleString()} Tk for "${task.title}" to ${task.employee?.name}?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Yes, Disburse',
      confirmButtonColor: '#eab308',
      cancelButtonColor: '#d33'
    });

    if (result.isConfirmed) {
      try {
        const salResponse = await fetch('/api/admin/employees/salaries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employeeId: task.employee?._id || task.employee,
            amount: task.payout,
            type: 'task_payment',
            remarks: `Payout for completed task: ${task.title}`
          })
        });

        if (!salResponse.ok) {
          const data = await salResponse.json();
          toast.error(data.message || 'Failed to disburse salary record');
          return;
        }

        const taskResponse = await fetch(`/api/admin/employees/tasks/${task._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'Paid' })
        });

        if (taskResponse.ok) {
          Swal.fire({
            icon: 'success',
            title: 'Payout Disbursed!',
            text: 'Disbursement logged and task marked as Paid',
            confirmButtonColor: '#eab308'
          });
          fetchData();
        } else {
          toast.error('Payment logged, but failed to update task status to Paid');
        }
      } catch (err) {
        toast.error('Something went wrong');
      }
    }
  };

  const taskEmps = employees.filter(e => e.employeeType === 'task-based');

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-950">Task Management</h1>
          <p className="text-sm text-zinc-500 mt-1">Assign, track, and pay task-based showroom staff for successfully finished goals.</p>
        </div>
        <div>
          <Button 
            onClick={() => {
              if (taskEmps.length > 0) {
                setAssignEmployeeId(taskEmps[0]._id);
              } else {
                setAssignEmployeeId('');
              }
              setAssignPayout('');
              setAssignDueDate('');
              setShowAssignModal(true);
            }}
            className="bg-primary text-primary-foreground font-bold flex items-center gap-1.5"
          >
            <Plus className="h-4 w-4" /> Assign New Task
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-10 w-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <Card className="border border-zinc-200">
          <CardHeader className="bg-zinc-50/50 border-b border-zinc-200 p-5">
            <CardTitle className="text-lg font-black text-zinc-900">Task Assignments Directory</CardTitle>
            <CardDescription className="text-sm text-zinc-500">Overview of all current, completed, and paid contractual task assignments.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {tasks.length === 0 ? (
              <div className="text-center py-16 text-zinc-400">
                <Briefcase className="h-12 w-12 mx-auto mb-3 opacity-60" />
                <p className="font-medium">No tasks assigned yet.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-200 text-zinc-500 font-bold">
                      <th className="p-4">Assigned Employee</th>
                      <th className="p-4">Task Details</th>
                      <th className="p-4">Payout</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Timeline / Dates</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((task) => (
                      <tr key={task._id} className="border-b border-zinc-100 hover:bg-zinc-50/50 transition-colors">
                        <td className="p-4 font-bold text-zinc-900">
                          {task.employee?.name || 'Unknown User'}
                          <div className="text-xs text-zinc-400 font-normal">{task.employee?.email}</div>
                          {task.employee?.phone && <div className="text-[11px] text-zinc-500 font-normal mt-0.5">{task.employee.phone}</div>}
                        </td>
                        <td className="p-4 max-w-[280px]">
                          <div className="font-bold text-zinc-900">{task.title}</div>
                          {task.description && <div className="text-xs text-zinc-500 mt-0.5 line-clamp-2" title={task.description}>{task.description}</div>}
                        </td>
                        <td className="p-4 font-black text-zinc-800">
                          {task.payout?.toLocaleString()} Tk
                        </td>
                        <td className="p-4">
                          <Badge 
                            className="font-bold" 
                            variant={
                              task.status === 'Paid' 
                                ? 'default' 
                                : task.status === 'Completed' 
                                ? 'secondary' 
                                : 'outline'
                            }
                          >
                            {task.status === 'Paid' ? 'Paid Out' : task.status === 'Completed' ? 'Completed' : 'Pending Work'}
                          </Badge>
                        </td>
                        <td className="p-4 text-xs text-zinc-500 space-y-0.5">
                          <div><span className="font-semibold">Assigned:</span> {new Date(task.assignedDate).toLocaleDateString()}</div>
                          {task.dueDate && (
                            <div className="text-amber-600 font-medium"><span className="font-semibold text-zinc-500">Expected Complete:</span> {new Date(task.dueDate).toLocaleDateString()}</div>
                          )}
                          {task.completedDate && (
                            <div className="text-emerald-600"><span className="font-semibold text-zinc-500">Completed:</span> {new Date(task.completedDate).toLocaleDateString()}</div>
                          )}
                        </td>
                        <td className="p-4 text-right">
                          <div className="flex justify-end gap-2">
                            {task.status === 'Completed' && (
                              <Button 
                                onClick={() => handleDisburseTaskPayout(task)}
                                size="sm"
                                className="bg-emerald-600 text-white hover:bg-emerald-700 h-8 flex items-center gap-1"
                              >
                                <DollarSign className="h-3.5 w-3.5" /> Disburse Payout
                              </Button>
                            )}
                            {task.status === 'Pending' && (
                              <Button
                                onClick={() => handleDeleteTask(task._id)}
                                variant="ghost"
                                size="icon"
                                className="text-red-500 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            {task.status === 'Paid' && (
                              <span className="text-xs text-zinc-400 italic font-medium flex items-center justify-center p-1 bg-zinc-100 rounded">Paid & Cleared</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Assign Task Modal */}
      {showAssignModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md bg-white border border-zinc-200 shadow-xl overflow-hidden animate-in fade-in duration-200">
            <CardHeader className="bg-zinc-50 border-b border-zinc-100 p-5">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-black text-zinc-900">Assign Task to Staff</CardTitle>
                <button 
                  onClick={() => setShowAssignModal(false)}
                  className="text-zinc-400 hover:text-zinc-600 p-1"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </CardHeader>
            <form onSubmit={handleAssignTask}>
              <CardContent className="p-5 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="assignEmp">Select Employee</Label>
                  <Select 
                    onValueChange={(val: any) => setAssignEmployeeId(val || '')} 
                    value={assignEmployeeId}
                  >
                    <SelectTrigger id="assignEmp">
                      <SelectValue placeholder="Choose task-based staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {taskEmps.map((emp) => (
                        <SelectItem key={emp._id} value={emp._id}>
                          {emp.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskTitle">Task Title</Label>
                  <Input 
                    id="taskTitle"
                    required
                    value={assignTitle}
                    onChange={(e) => setAssignTitle(e.target.value)}
                    placeholder="e.g. Design main entrance double door"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskDesc">Description (Optional)</Label>
                  <Input 
                    id="taskDesc"
                    value={assignDescription}
                    onChange={(e) => setAssignDescription(e.target.value)}
                    placeholder="Describe specific requirements, dimensions, etc."
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskPayout">Payout Amount (Tk)</Label>
                  <Input 
                    id="taskPayout"
                    type="number"
                    required
                    value={assignPayout}
                    onChange={(e) => setAssignPayout(e.target.value)}
                    placeholder="e.g. 500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="taskDueDate">Expected Completion Date</Label>
                  <Input 
                    id="taskDueDate"
                    type="date"
                    value={assignDueDate}
                    onChange={(e) => setAssignDueDate(e.target.value)}
                  />
                </div>
              </CardContent>
              <div className="p-5 bg-zinc-50 border-t border-zinc-100 flex justify-end gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowAssignModal(false)}>Cancel</Button>
                <Button type="submit" className="bg-primary text-primary-foreground font-bold">Assign Task</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
