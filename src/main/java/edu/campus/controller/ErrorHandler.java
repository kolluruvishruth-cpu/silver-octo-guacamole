package edu.campus.controller;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.*;
import edu.campus.exception.DomainException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.dao.DataIntegrityViolationException;
import java.util.Map;
@RestControllerAdvice
public class ErrorHandler {
 @ExceptionHandler(DomainException.class) ResponseEntity<?> domain(DomainException e){return ResponseEntity.badRequest().body(Map.of("message",e.getMessage()));}
 @ExceptionHandler(MethodArgumentNotValidException.class) ResponseEntity<?> validation(MethodArgumentNotValidException e){var f=e.getBindingResult().getFieldErrors().get(0);return ResponseEntity.badRequest().body(Map.of("message",f.getField()+": "+f.getDefaultMessage()));}
 @ExceptionHandler(DataIntegrityViolationException.class) ResponseEntity<?> duplicate(){return ResponseEntity.badRequest().body(Map.of("message","A record with these unique details already exists, or input is too long."));}
}
