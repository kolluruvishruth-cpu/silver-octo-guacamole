package edu.campus.controller;
import edu.campus.entity.*;
import edu.campus.repository.*;
import edu.campus.service.BookingService;
import edu.campus.dto.Requests.*;
import edu.campus.exception.DomainException;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.http.*;
import java.security.Principal;
import java.time.*;
import java.util.*;
@RestController @RequestMapping("/api")
public class ApiController {
 private final UserRepository users;private final ResourceRepository resources;private final BookingRepository bookings;private final NotificationRepository notifications;private final BookingService service;private final PasswordEncoder encoder;private final JdbcTemplate jdbc;
 public ApiController(UserRepository u,ResourceRepository r,BookingRepository b,NotificationRepository n,BookingService s,PasswordEncoder e,JdbcTemplate j){users=u;resources=r;bookings=b;notifications=n;service=s;encoder=e;jdbc=j;}
 User user(Principal p){var u=users.findByEmail(p.getName()).orElseThrow();if(!u.active)throw new DomainException("Account disabled. Please sign out.");return u;}
 @GetMapping("/csrf") Map<String,String> csrf(CsrfToken t){return Map.of("token",t.getToken(),"headerName",t.getHeaderName());}
 @PostMapping("/register") @Transactional public User register(@Valid @RequestBody Registration q){
  String email=q.email().trim().toLowerCase();if(!q.password().equals(q.confirmPassword()))throw new DomainException("Passwords do not match");
  if(users.existsByEmail(email))throw new DomainException("This email is already registered");
  if(users.existsByRegistration(q.registration().trim()))throw new DomainException("This registration / employee ID already exists");
  var u=new User();u.name=q.name().trim();u.email=email;u.registration=q.registration().trim();u.department=q.department();u.role=q.role();u.setPassword(encoder.encode(q.password()));return users.save(u);
 }
 @GetMapping("/me") User me(Principal p){return user(p);}
 @PutMapping("/me") @Transactional User profile(Principal p,@Valid @RequestBody Profile q){var u=user(p);if(users.findAll().stream().anyMatch(x->!x.id.equals(u.id)&&x.registration.equals(q.registration().trim())))throw new DomainException("ID already in use");u.name=q.name();u.department=q.department();u.registration=q.registration().trim();return users.save(u);}
 @PostMapping("/me/password") Map<String,Boolean> password(Principal p,@Valid @RequestBody Password q){var u=user(p);if(!encoder.matches(q.currentPassword(),u.getPassword()))throw new DomainException("Current password is incorrect");u.setPassword(encoder.encode(q.newPassword()));users.save(u);return Map.of("ok",true);}
 @GetMapping("/resources") List<Resource> catalogue(Principal p){user(p);return resources.findAll().stream().filter(x->x.active).toList();}
 @GetMapping("/resources/{id}") Resource resource(Principal p,@PathVariable Long id){user(p);return resources.findById(id).orElseThrow(()->new DomainException("Resource not found"));}
 @GetMapping("/resources/{id}/availability") List<Map<String,Object>> availability(Principal p,@PathVariable Long id,@RequestParam LocalDate date){user(p);return bookings.conflicts(id,date.atStartOfDay(),date.plusDays(1).atStartOfDay()).stream().map(b->Map.<String,Object>of("startTime",b.startTime,"endTime",b.endTime,"status",b.status)).toList();}
 @GetMapping("/bookings") List<Booking> mine(Principal p){return bookings.findByUserIdOrderByStartTimeDesc(user(p).id);}
 @GetMapping("/bookings/{id}") Booking booking(Principal p,@PathVariable Long id){var u=user(p);return bookings.findById(id).filter(b->b.user.id.equals(u.id)).orElseThrow(()->new DomainException("Booking not found"));}
 @PostMapping("/bookings") Booking request(Principal p,@Valid @RequestBody BookingRequest q){return service.request(user(p),q);}
 @PostMapping("/bookings/{id}/cancel") Booking cancel(Principal p,@PathVariable Long id){return service.cancel(user(p),id);}
 @GetMapping("/notifications") List<Notification> notifications(Principal p){return notifications.findByUserIdOrderByCreatedAtDesc(user(p).id);}
 @PostMapping("/notifications/{id}/read") Notification read(Principal p,@PathVariable Long id){var u=user(p);var n=notifications.findById(id).filter(x->x.user.id.equals(u.id)).orElseThrow(()->new DomainException("Notification not found"));n.isRead=true;return notifications.save(n);}
 @GetMapping("/admin/resources") List<Resource> allResources(Principal p){user(p);return resources.findAll();}
 @PostMapping("/admin/resources") Resource add(Principal p,@Valid @RequestBody ResourceInput q){user(p);return saveResource(new Resource(),q);}
 @PutMapping("/admin/resources/{id}") @Transactional Resource edit(Principal p,@PathVariable Long id,@Valid @RequestBody ResourceInput q){user(p);return saveResource(resources.lockById(id).orElseThrow(),q);}
 Resource saveResource(Resource r,ResourceInput q){r.name=q.name();r.category=q.category();r.building=q.building();r.location=q.location();r.capacity=q.capacity();r.description=q.description();r.facilities=q.facilities();r.imageUrl=q.imageUrl();r.active=q.active();return resources.save(r);}
 @GetMapping("/admin/bookings") List<Booking> allBookings(Principal p){user(p);return bookings.findAll();}
 @PostMapping("/admin/bookings/{id}/decision") Booking decision(Principal p,@PathVariable Long id,@Valid @RequestBody Decision q){user(p);return service.decide(id,q.status(),q.reason());}
 @GetMapping("/admin/users") List<User> allUsers(Principal p){user(p);return users.findAll();}
 @PostMapping("/admin/users/{id}/active") User active(Principal p,@PathVariable Long id,@RequestBody Map<String,Boolean> q){var self=user(p);if(self.id.equals(id))throw new DomainException("You cannot disable your own account");var u=users.findById(id).orElseThrow();u.active=Boolean.TRUE.equals(q.get("active"));return users.save(u);}
 @GetMapping("/admin/reports") Map<String,Object> reports(Principal p){user(p);return Map.of("byStatus",jdbc.queryForList("SELECT status, COUNT(*) AS total FROM bookings GROUP BY status"),"byResource",jdbc.queryForList("SELECT r.name, COUNT(b.id) AS total FROM resources r LEFT JOIN bookings b ON r.id=b.resource_id GROUP BY r.id,r.name ORDER BY total DESC"),"byDate",jdbc.queryForList("SELECT CAST(start_time AS DATE) AS booking_date, COUNT(*) AS total FROM bookings GROUP BY CAST(start_time AS DATE) ORDER BY booking_date"),"byUser",jdbc.queryForList("SELECT u.name,COUNT(b.id) AS total FROM campus_users u LEFT JOIN bookings b ON u.id=b.user_id GROUP BY u.id,u.name ORDER BY total DESC"));}
 static String cell(Object x){String s=x==null?"":x.toString();if(s.matches("^[=+@\\-].*"))s="'"+s;return "\""+s.replace("\"","\"\"")+"\"";}
 @GetMapping("/admin/export/{kind}") ResponseEntity<String> export(Principal p,@PathVariable String kind,@RequestParam(defaultValue="") String status,@RequestParam(defaultValue="") String search,@RequestParam(defaultValue="") String date,@RequestParam(defaultValue="") String resource,@RequestParam(defaultValue="") String person){user(p);var out=new StringBuilder();if(kind.equals("bookings")){out.append("ID,Resource,User,Start,End,Purpose,Status\r\n");bookings.findAll().stream().filter(b->status.isBlank()||b.status.equals(status)).filter(b->date.isBlank()||b.startTime.toLocalDate().toString().equals(date)).filter(b->resource.isBlank()||b.resource.id.toString().equals(resource)).filter(b->person.isBlank()||b.user.id.toString().equals(person)).filter(b->(b.purpose+" "+b.resource.name+" "+b.user.name).toLowerCase().contains(search.toLowerCase())).forEach(b->out.append(String.join(",",cell(b.id),cell(b.resource.name),cell(b.user.name),cell(b.startTime),cell(b.endTime),cell(b.purpose),cell(b.status))).append("\r\n"));}else if(kind.equals("resources")){out.append("ID,Name,Category,Building,Location,Capacity,Active\r\n");resources.findAll().stream().filter(r->(r.name+" "+r.building+" "+r.location).toLowerCase().contains(search.toLowerCase())).forEach(r->out.append(String.join(",",cell(r.id),cell(r.name),cell(r.category),cell(r.building),cell(r.location),cell(r.capacity),cell(r.active))).append("\r\n"));}else throw new DomainException("Unknown export");return ResponseEntity.ok().header("Content-Disposition","attachment; filename="+kind+".csv").contentType(MediaType.parseMediaType("text/csv")).body(out.toString());}
}
