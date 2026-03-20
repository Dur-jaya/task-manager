import 'package:flutter/material.dart';
import 'dart:convert';
import 'package:http/http.dart' as http;

void main() {
  runApp(MyApp());
}

String token = "";

// 🔥 IMPORTANT: Chrome ke liye localhost use karo
const BASE_URL = "http://localhost:5000";

class MyApp extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      home: LoginPage(),
    );
  }
}

// ================= LOGIN =================
class LoginPage extends StatefulWidget {
  @override
  _LoginPageState createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  TextEditingController email = TextEditingController();
  TextEditingController password = TextEditingController();
  bool loading = false;

  login() async {
    setState(() => loading = true);

    try {
      var res = await http.post(
        Uri.parse("$BASE_URL/auth/login"),
        headers: {"Content-Type": "application/json"},
        body: jsonEncode({
          "email": email.text,
          "password": password.text,
        }),
      );

      if (res.statusCode != 200) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text("Login failed ❌")),
        );
        setState(() => loading = false);
        return;
      }

      var data = jsonDecode(res.body);
      token = data["accessToken"];

      Navigator.push(
        context,
        MaterialPageRoute(builder: (_) => Dashboard()),
      );
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text("Server error ❌")),
      );
    }

    setState(() => loading = false);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Center(
        child: Container(
          width: 350,
          padding: EdgeInsets.all(20),
          decoration: BoxDecoration(
            color: Colors.black12,
            borderRadius: BorderRadius.circular(20),
          ),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text("Login", style: TextStyle(fontSize: 24)),

              TextField(
                controller: email,
                decoration: InputDecoration(labelText: "Email"),
              ),

              TextField(
                controller: password,
                decoration: InputDecoration(labelText: "Password"),
                obscureText: true,
              ),

              SizedBox(height: 20),

              ElevatedButton(
                onPressed: loading ? null : login,
                child: loading
                    ? CircularProgressIndicator(color: Colors.white)
                    : Text("Login"),
              )
            ],
          ),
        ),
      ),
    );
  }
}

// ================= DASHBOARD =================
class Dashboard extends StatefulWidget {
  @override
  _DashboardState createState() => _DashboardState();
}

class _DashboardState extends State<Dashboard> {
  List tasks = [];
  TextEditingController title = TextEditingController();

  fetchTasks() async {
    try {
      var res = await http.get(
        Uri.parse("$BASE_URL/tasks"),
        headers: {"Authorization": "Bearer $token"},
      );

      if (res.statusCode != 200) return;

      setState(() {
        tasks = jsonDecode(res.body);
      });
    } catch (e) {
      print("Error fetching tasks");
    }
  }

  addTask() async {
    if (title.text.isEmpty) return;

    await http.post(
      Uri.parse("$BASE_URL/tasks"),
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer $token"
      },
      body: jsonEncode({"title": title.text}),
    );

    title.clear();
    fetchTasks();
  }

  deleteTask(id) async {
    await http.delete(
      Uri.parse("$BASE_URL/tasks/$id"),
      headers: {"Authorization": "Bearer $token"},
    );

    fetchTasks();
  }

  toggleTask(id) async {
    await http.patch(
      Uri.parse("$BASE_URL/tasks/$id/toggle"),
      headers: {"Authorization": "Bearer $token"},
    );

    fetchTasks();
  }

  @override
  void initState() {
    super.initState();
    fetchTasks();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text("Task Dashboard")),

      body: Column(
        children: [
          Padding(
            padding: EdgeInsets.all(10),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: title,
                    decoration: InputDecoration(
                      hintText: "Add task...",
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                SizedBox(width: 10),
                ElevatedButton(onPressed: addTask, child: Text("Add"))
              ],
            ),
          ),

          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => fetchTasks(),
              child: ListView.builder(
                itemCount: tasks.length,
                itemBuilder: (context, i) {
                  return Card(
                    margin: EdgeInsets.all(8),
                    child: ListTile(
                      title: Text(tasks[i]["title"]),
                      subtitle: Text(
                          tasks[i]["completed"] ? "Completed ✅" : "Pending ❌"),
                      leading: IconButton(
                        icon: Icon(Icons.check_circle),
                        onPressed: () => toggleTask(tasks[i]["id"]),
                      ),
                      trailing: IconButton(
                        icon: Icon(Icons.delete),
                        onPressed: () => deleteTask(tasks[i]["id"]),
                      ),
                    ),
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}