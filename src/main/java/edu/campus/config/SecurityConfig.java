package edu.campus.config;
import edu.campus.repository.UserRepository;
import org.springframework.context.annotation.*;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.*;
@Configuration
public class SecurityConfig {
 @Bean PasswordEncoder encoder(){return new BCryptPasswordEncoder();}
 @Bean UserDetailsService users(UserRepository repo){return email->{var u=repo.findByEmail(email.trim().toLowerCase()).orElseThrow(()->new UsernameNotFoundException("Account not found"));return User.withUsername(u.email).password(u.getPassword()).roles(u.role).disabled(!u.active).build();};}
 @Bean SecurityFilterChain filter(HttpSecurity http)throws Exception {
  return http.authorizeHttpRequests(a->a.requestMatchers("/","/index.html","/app.js","/style.css","/api/csrf","/api/register","/error").permitAll().requestMatchers("/api/admin/**").hasRole("ADMIN").anyRequest().authenticated())
   .exceptionHandling(e->e.authenticationEntryPoint((q,s,x)->s.sendError(401)).accessDeniedHandler((q,s,x)->s.sendError(403)))
   .formLogin(f->f.loginProcessingUrl("/api/login").successHandler((q,s,a)->{s.setContentType("application/json");s.getWriter().write("{\"ok\":true}");}).failureHandler((q,s,e)->{s.setStatus(401);s.setContentType("application/json");s.getWriter().write("{\"message\":\"Incorrect email or password, or account disabled.\"}");}).permitAll())
   .logout(l->l.logoutUrl("/api/logout").logoutSuccessHandler((q,s,a)->s.setStatus(204))).build();
 }
}
