package edu.campus;
import edu.campus.dto.Requests.*;
import edu.campus.entity.*;
import edu.campus.repository.*;
import edu.campus.service.BookingService;
import edu.campus.exception.DomainException;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.context.support.WithMockUser;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;
import static org.junit.jupiter.api.Assertions.*;
import java.time.*;
import java.util.concurrent.*;
@SpringBootTest(properties={"spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1","spring.jpa.hibernate.ddl-auto=create-drop","app.demo=false","app.admin.email=","app.admin.password="})
@AutoConfigureMockMvc
class CampusIntegrationTest {
 @Autowired BookingService service;@Autowired UserRepository users;@Autowired ResourceRepository resources;@Autowired BookingRepository bookings;@Autowired NotificationRepository notices;@Autowired MockMvc mvc;
 User owner,other;Resource resource;LocalDateTime start;
 @BeforeEach void setup(){notices.deleteAll();bookings.deleteAll();resources.deleteAll();users.deleteAll();owner=addUser("student@campus.test","S1");other=addUser("other@campus.test","S2");resource=new Resource();resource.name="Lab";resource.category="Laboratory";resource.capacity=20;resources.save(resource);start=LocalDate.now().plusDays(2).atTime(10,0);}
 User addUser(String email,String id){var u=new User();u.email=email;u.registration=id;u.name="Student";u.department="CSE";u.role="STUDENT";u.setPassword("unused");return users.save(u);}
 BookingRequest request(LocalDateTime s,LocalDateTime e){return new BookingRequest(resource.id,s,e,"Workshop",10,"");}
 @Test void freeSlot(){var b=service.request(owner,request(start,start.plusHours(1)));assertEquals("PENDING",b.status);assertEquals(1,notices.count());}
 @Test void overlap(){service.request(owner,request(start,start.plusHours(1)));assertThrows(DomainException.class,()->service.request(other,request(start.plusMinutes(30),start.plusHours(2))));}
 @Test void adjacent(){service.request(owner,request(start,start.plusHours(1)));assertNotNull(service.request(other,request(start.plusHours(1),start.plusHours(2))).id);}
 @Test void past(){assertThrows(DomainException.class,()->service.request(owner,request(start.minusDays(4),start.minusDays(4).plusHours(1))));}
 @Test void reversed(){assertThrows(DomainException.class,()->service.request(owner,request(start,start.minusHours(1))));}
 @Test void inactive(){resource.active=false;resources.save(resource);assertThrows(DomainException.class,()->service.request(owner,request(start,start.plusHours(1))));}
 @Test void capacity(){assertThrows(DomainException.class,()->service.request(owner,new BookingRequest(resource.id,start,start.plusHours(1),"Too many",21,"")));}
 @Test void cancelReleases(){var b=service.request(owner,request(start,start.plusHours(1)));assertEquals("CANCELLED",service.cancel(owner,b.id).status);assertNotNull(service.request(other,request(start,start.plusHours(1))).id);assertEquals(2,bookings.count());}
 @Test void onlyOwnerCancel(){var b=service.request(owner,request(start,start.plusHours(1)));assertThrows(DomainException.class,()->service.cancel(other,b.id));}
 @Test void approve(){var b=service.request(owner,request(start,start.plusHours(1)));assertEquals("APPROVED",service.decide(b.id,"APPROVED",null).status);}
 @Test void rejectReleases(){var b=service.request(owner,request(start,start.plusHours(1)));assertThrows(DomainException.class,()->service.decide(b.id,"REJECTED",""));assertEquals("REJECTED",service.decide(b.id,"REJECTED","Teaching session").status);assertNotNull(service.request(other,request(start,start.plusHours(1))).id);}
 @Test void concurrentOverlap()throws Exception{var pool=Executors.newFixedThreadPool(2);var gate=new CountDownLatch(1);Callable<Boolean> job=()->{gate.await();try{service.request(owner,request(start,start.plusHours(1)));return true;}catch(DomainException e){return false;}};try{var a=pool.submit(job);var b=pool.submit(job);gate.countDown();assertNotEquals(a.get(10,TimeUnit.SECONDS),b.get(10,TimeUnit.SECONDS));assertEquals(1,bookings.count());}finally{pool.shutdownNow();}}
 @Test @WithMockUser(username="student@campus.test",roles="STUDENT") void adminProtected()throws Exception{mvc.perform(get("/api/admin/users")).andExpect(status().isForbidden());}
 @Test void anonymousProtected()throws Exception{mvc.perform(get("/api/bookings")).andExpect(status().isUnauthorized());}
 @Test @WithMockUser(username="other@campus.test",roles="STUDENT") void onlyOwnerView()throws Exception{var b=service.request(owner,request(start,start.plusHours(1)));mvc.perform(get("/api/bookings/"+b.id)).andExpect(status().isBadRequest());}
 String registration(String email,String role,String password){return "{\"name\":\"New Student\",\"email\":\""+email+"\",\"registration\":\"N1\",\"department\":\"CSE\",\"role\":\""+role+"\",\"password\":\""+password+"\",\"confirmPassword\":\""+password+"\"}";}
 @Test void validRegistration()throws Exception{mvc.perform(post("/api/register").with(csrf()).contentType("application/json").content(registration("new@campus.test","STUDENT","TestPassword123"))).andExpect(status().isOk()).andExpect(jsonPath("$.password").doesNotExist());assertTrue(users.findByEmail("new@campus.test").orElseThrow().getPassword().startsWith("$2"));}
 @Test void duplicateEmail()throws Exception{mvc.perform(post("/api/register").with(csrf()).contentType("application/json").content(registration(owner.email,"STUDENT","TestPassword123"))).andExpect(status().isBadRequest());}
 @Test void adminRegistrationDenied()throws Exception{mvc.perform(post("/api/register").with(csrf()).contentType("application/json").content(registration("new@campus.test","ADMIN","TestPassword123"))).andExpect(status().isBadRequest());}
 @Test void shortPasswordDenied()throws Exception{mvc.perform(post("/api/register").with(csrf()).contentType("application/json").content(registration("new@campus.test","STUDENT","123"))).andExpect(status().isBadRequest());}
 @Test void csrfRequired()throws Exception{mvc.perform(post("/api/register").contentType("application/json").content(registration("new@campus.test","STUDENT","TestPassword123"))).andExpect(status().isForbidden());}
}
