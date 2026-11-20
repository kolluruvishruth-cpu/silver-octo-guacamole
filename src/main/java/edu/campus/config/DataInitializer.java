package edu.campus.config;
import edu.campus.entity.*;
import edu.campus.repository.*;
import org.springframework.stereotype.Component;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import java.time.*;
@Component
public class DataInitializer implements CommandLineRunner {
 private final UserRepository users;private final ResourceRepository resources;private final BookingRepository bookings;private final PasswordEncoder encoder;
 @Value("${app.demo}") boolean demo;@Value("${app.admin.email}") String email;@Value("${app.admin.password}") String password;
 public DataInitializer(UserRepository u,ResourceRepository r,BookingRepository b,PasswordEncoder e){users=u;resources=r;bookings=b;encoder=e;}
 User account(String name,String email,String id,String role,String pass){var u=new User();u.name=name;u.email=email;u.registration=id;u.role=role;u.department="Computer Science & Engineering";u.setPassword(encoder.encode(pass));return users.save(u);}
 public void run(String... args){
  if(!email.isBlank()&&!password.isBlank()&&!users.existsByEmail(email.toLowerCase())){if(password.length()<12)throw new IllegalStateException("ADMIN_PASSWORD must contain at least 12 characters");account("Campus Administrator",email.toLowerCase(),"ADMIN-001","ADMIN",password);}
  if(!demo)return;
  var student=users.findByEmail("student@campus.test").orElseGet(()->account("Aarav Sharma","student@campus.test","AP20260001","STUDENT","CampusDemo!2026"));
  if(!users.existsByEmail("faculty@campus.test"))account("Dr. Priya Rao","faculty@campus.test","EMP2026001","FACULTY","CampusDemo!2026");
  if(resources.count()==0){String[][] data={{"Innovation Lab","Laboratory","Vikram Sarabhai Block","Lab 204","40","Workstations, Wi-Fi, Smart display","A collaborative space for software projects, research and hands-on learning."},{"Senate Seminar Hall","Seminar Hall","Academic Block A","Level 2","180","Stage, Projector, Sound system","A spacious venue for guest lectures, department events and student showcases."},{"CSE Smart Classroom","Classroom","Academic Block B","Room 301","60","Smart board, Projector, AC","A connected classroom designed for focused teaching and group presentations."},{"Executive Conference Room","Conference Room","Administration Block","Room 105","20","Video conferencing, Whiteboard","A quiet meeting room for faculty discussions and project reviews."},{"Indoor Sports Arena","Sports Facility","Sports Complex","Court 1","30","Badminton court, Seating","A multipurpose indoor court for practice sessions and student activities."},{"Portable Projector","Equipment","Central Library","Equipment desk","1","HDMI, Carry case","A portable presentation kit available for campus academic activities."}};
   for(var a:data){var r=new Resource();r.name=a[0];r.category=a[1];r.building=a[2];r.location=a[3];r.capacity=Integer.valueOf(a[4]);r.facilities=a[5];r.description=a[6];resources.save(r);}
  }
  if(bookings.count()==0){var list=resources.findAll();String[] states={"PENDING","APPROVED","REJECTED","CANCELLED","COMPLETED"};for(int i=0;i<5;i++){var b=new Booking();b.user=student;b.resource=list.get(i);b.startTime=LocalDate.now().plusDays(i==4?-2:i+1).atTime(10,0);b.endTime=b.startTime.plusHours(1);b.purpose=new String[]{"Project team workshop","Department guest lecture","Study group","Research discussion","Sports practice"}[i];b.attendees=10;b.status=states[i];if(i==2)b.rejectionReason="Room reserved for scheduled teaching. Please choose another slot.";bookings.save(b);}}
 }
}
